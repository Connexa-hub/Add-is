import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { apiClient } from '../utils/apiClient';
import { API_BASE_URL } from '../constants/api';

export interface BiometricCapabilities {
  isAvailable: boolean;
  isEnrolled: boolean;
  biometricType: string | null;
  supportedTypes: LocalAuthentication.AuthenticationType[];
}

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
}

const BIOMETRIC_ENABLED_KEY = 'biometricEnabled';
const CREDENTIALS_KEY_PREFIX = 'biometric_credentials_';
const DEVICE_ID_KEY = 'biometric_device_id';

// SecureStore options that additionally gate access behind the OS biometric
// prompt at the keystore layer (iOS Keychain / Android Keystore), not just
// at the application-logic layer. Without this, the stored credential can
// in principle be read by any code path that calls getItemAsync — the app
// calling LocalAuthentication.authenticateAsync() first is a convention,
// not an OS-enforced guarantee. With requireAuthentication, the OS itself
// refuses to release the value until biometric/passcode unlock succeeds.
const secureStoreBiometricOptions = {
  requireAuthentication: true,
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

/** Stable per-install device id, generated once and persisted. Sent to the
 * backend so each device's biometric credential can be individually rotated
 * and revoked, instead of one shared secret for the whole account. */
const getOrCreateDeviceId = async (): Promise<string> => {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = Crypto.randomUUID();
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
};

const requestBiometricToken = async (
  authToken: string,
  deviceId: string,
  deviceLabel?: string
): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    // Routed through apiClient (not raw axios) so a 401 here triggers the
    // same auto-refresh-and-retry as everywhere else, instead of just
    // failing. apiClient's interceptor attaches the current stored access
    // token automatically — the `authToken` param is still accepted for
    // API-compatibility with callers, but no longer needs to be attached
    // manually here.
    const response = await apiClient.post(
      `${API_BASE_URL}/api/auth/enable-biometric`,
      { deviceId, deviceLabel: deviceLabel || `${Platform.OS} device` },
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (response.data.success && response.data.data.biometricToken) {
      return response.data.data.biometricToken;
    }
    return null;
  } catch (error: any) {
    if (error.response?.status === 429) {
      console.error('Rate limit error when requesting biometric token');
    } else if (error.response?.status === 401) {
      console.error('Authentication error when requesting biometric token');
    } else {
      console.error('Error requesting biometric token:', error.message);
    }
    return null;
  }
};

export const useBiometric = () => {
  const [capabilities, setCapabilities] = useState<BiometricCapabilities>({
    isAvailable: false,
    isEnrolled: false,
    biometricType: null,
    supportedTypes: [],
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkBiometricCapabilities();
  }, []);

  const checkBiometricCapabilities = async () => {
    try {
      setIsLoading(true);

      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

      let biometricType = null;
      if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'Face ID';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'Fingerprint';
      } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
        biometricType = 'Iris';
      }

      setCapabilities({
        isAvailable: compatible && enrolled,
        isEnrolled: enrolled,
        biometricType,
        supportedTypes,
      });
    } catch (error) {
      console.error('Error checking biometric capabilities:', error);
      setCapabilities({
        isAvailable: false,
        isEnrolled: false,
        biometricType: null,
        supportedTypes: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  const authenticate = async (
    promptMessage?: string,
    cancelLabel?: string
  ): Promise<BiometricAuthResult> => {
    try {
      if (!capabilities.isAvailable) {
        return {
          success: false,
          error: capabilities.isEnrolled
            ? 'Biometric authentication is not available on this device'
            : 'No biometric authentication is enrolled. Please set up fingerprint or face recognition in your device settings.',
        };
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: promptMessage || `Authenticate with ${capabilities.biometricType || 'biometric'}`,
        cancelLabel: cancelLabel || 'Cancel',
        fallbackLabel: '',
        disableDeviceFallback: true,
      });

      if (result.success) {
        return { success: true };
      } else {
        let errorMessage = 'Authentication failed';

        if (result.error === 'user_cancel') {
          errorMessage = 'Authentication cancelled by user';
        } else if (result.error === 'system_cancel') {
          errorMessage = 'Authentication cancelled by system';
        } else if (result.error === 'lockout') {
          errorMessage = 'Too many failed attempts. Please try again later.';
        } else if (result.error === 'not_enrolled') {
          errorMessage = 'No biometric authentication enrolled on this device';
        } else if (result.error === 'user_fallback') {
          errorMessage = 'User chose to use fallback authentication';
        }

        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during authentication',
      };
    }
  };

  const isBiometricEnabled = async (): Promise<boolean> => {
    try {
      const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error checking biometric enabled status:', error);
      return false;
    }
  };

  const enableBiometric = async (userId: string, token?: string): Promise<boolean> => {
    try {
      if (!capabilities.isAvailable) {
        Alert.alert(
          'Biometric Unavailable',
          capabilities.isEnrolled
            ? 'Biometric authentication is not available on this device'
            : 'Please set up fingerprint or face recognition in your device settings first.'
        );
        return false;
      }

      // CRITICAL: Trigger system biometric authentication FIRST
      const authResult = await authenticate(
        `Authenticate with ${capabilities.biometricType || 'biometric'}`,
        'Cancel'
      );

      if (!authResult.success) {
        // User cancelled or authentication failed
        const errorMsg = authResult.error === 'Authentication cancelled by user'
          ? 'Setup cancelled. You can enable biometric authentication later in Settings.'
          : `Authentication failed: ${authResult.error}`;
        
        Alert.alert('Setup Cancelled', errorMsg);
        return false;
      }

      // Get token from secure storage if not provided
      let authToken = token;
      if (!authToken) {
        authToken = await SecureStore.getItemAsync('auth_token');
        if (!authToken) {
          Alert.alert('Error', 'Authentication token not found. Please login again.');
          return false;
        }
      }

      const deviceId = await getOrCreateDeviceId();

      // Request biometric token from server
      const biometricToken = await requestBiometricToken(authToken, deviceId);
      if (!biometricToken) {
        // CRITICAL: Don't save biometric settings if backend request fails
        Alert.alert(
          'Setup Failed', 
          'Failed to setup biometric authentication with server. Please try again in a few moments.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Save biometric settings ONLY after successful backend token generation.
      // The credential itself is stored with requireAuthentication so the OS
      // won't release it again without another biometric/passcode unlock.
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      await AsyncStorage.setItem('biometric_user_id', userId);
      await SecureStore.setItemAsync(
        `${CREDENTIALS_KEY_PREFIX}${userId}`,
        biometricToken,
        secureStoreBiometricOptions
      );

      Alert.alert('Success!', `${capabilities.biometricType || 'Biometric'} authentication enabled successfully!`);
      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      
      // CRITICAL: Clear any partial biometric settings on error
      try {
        await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
        await AsyncStorage.removeItem('biometric_user_id');
        await SecureStore.deleteItemAsync(`${CREDENTIALS_KEY_PREFIX}${userId}`);
      } catch (cleanupError) {
        console.error('Error cleaning up biometric settings:', cleanupError);
      }
      
      Alert.alert('Error', 'Failed to enable biometric authentication. Please try again later.');
      return false;
    }
  };

  const disableBiometric = async (): Promise<boolean> => {
    try {
      // Revoke server-side too — clearing only local storage would leave the
      // credential still valid if it were ever extracted from the device
      // (e.g. a compromised backup). Best-effort: proceed with local
      // cleanup even if this call fails, since the user's intent to disable
      // biometric login locally should still succeed.
      try {
        const deviceId = await getOrCreateDeviceId();
        await apiClient.delete(`${API_BASE_URL}/api/auth/biometric-devices/${deviceId}`);
      } catch (revokeError) {
        console.error('Error revoking biometric device server-side:', revokeError);
      }

      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem('biometric_user_id');

      const userId = await AsyncStorage.getItem('userId');
      if (userId) {
        await SecureStore.deleteItemAsync(`${CREDENTIALS_KEY_PREFIX}${userId}`);
      }

      return true;
    } catch (error) {
      console.error('Error disabling biometric:', error);
      Alert.alert('Error', 'Failed to disable biometric authentication');
      return false;
    }
  };

  const saveCredentials = async (
    userId: string,
    email: string
  ): Promise<boolean> => {
    try {
      if (!capabilities.isAvailable) {
        return false;
      }

      await AsyncStorage.setItem('savedEmail', email);

      return true;
    } catch (error) {
      console.error('Error saving credentials:', error);
      return false;
    }
  };

  const savePINForBiometric = async (
    userId: string,
    encryptedPIN: string
  ): Promise<boolean> => {
    try {
      if (!capabilities.isAvailable) {
        return false;
      }

      // Store encrypted PIN securely for biometric access
      await SecureStore.setItemAsync(`biometric_pin_${userId}`, encryptedPIN);
      await AsyncStorage.setItem('biometric_pin_enabled', 'true');

      return true;
    } catch (error) {
      console.error('Error saving PIN for biometric:', error);
      return false;
    }
  };

  const getPINForBiometric = async (userId: string): Promise<string | null> => {
    try {
      const pin = await SecureStore.getItemAsync(`biometric_pin_${userId}`);
      return pin;
    } catch (error) {
      console.error('Error retrieving PIN for biometric:', error);
      return null;
    }
  };

  const clearBiometricPIN = async (userId: string): Promise<boolean> => {
    try {
      await SecureStore.deleteItemAsync(`biometric_pin_${userId}`);
      await AsyncStorage.removeItem('biometric_pin_enabled');
      return true;
    } catch (error) {
      console.error('Error clearing biometric PIN:', error);
      return false;
    }
  };

  const getStoredBiometricToken = async (userId: string): Promise<string | null> => {
    try {
      const biometricToken = await SecureStore.getItemAsync(
        `${CREDENTIALS_KEY_PREFIX}${userId}`,
        secureStoreBiometricOptions
      );

      return biometricToken;
    } catch (error) {
      console.error('Error retrieving biometric token:', error);
      return null;
    }
  };

  /** Call this after a successful /biometric-login response — the backend
   * rotates the credential on every use (same principle as refresh-token
   * rotation), so the old stored value is no longer valid and must be
   * overwritten with the new one the server just returned. */
  const saveRotatedBiometricToken = async (userId: string, newToken: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(
        `${CREDENTIALS_KEY_PREFIX}${userId}`,
        newToken,
        secureStoreBiometricOptions
      );
    } catch (error) {
      console.error('Error saving rotated biometric token:', error);
    }
  };

  const authenticateForLogin = async (): Promise<{
    success: boolean;
    biometricToken?: string;
    userId?: string;
    deviceId?: string;
    error?: string;
  }> => {
    try {
      const enabled = await isBiometricEnabled();
      if (!enabled) {
        console.log('Biometric not enabled');
        return {
          success: false,
          error: 'Biometric login is not enabled',
        };
      }

      const userId = await AsyncStorage.getItem('biometric_user_id');
      if (!userId) {
        console.log('No biometric user ID found');
        return {
          success: false,
          error: 'No biometric login configured',
        };
      }

      console.log('Authenticating biometric for user:', userId);
      const authResult = await authenticate('Login with biometric', 'Cancel');
      if (!authResult.success) {
        console.log('Biometric authentication failed:', authResult.error);
        return {
          success: false,
          error: authResult.error,
        };
      }

      console.log('Retrieving stored biometric token');
      const biometricToken = await getStoredBiometricToken(userId);
      if (!biometricToken) {
        console.log('No biometric token found in secure storage');
        // Clear biometric settings if token is missing
        await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
        await AsyncStorage.removeItem('biometric_user_id');
        return {
          success: false,
          error: 'Biometric credentials not found. Please login with email and password.',
        };
      }

      const deviceId = await getOrCreateDeviceId();

      console.log('Biometric login successful');
      return {
        success: true,
        biometricToken,
        userId,
        deviceId,
      };
    } catch (error) {
      console.error('Error authenticating for login:', error);
      return {
        success: false,
        error: 'An unexpected error occurred during biometric authentication',
      };
    }
  };

  const promptEnableBiometric = (
    onEnable: () => void,
    onSkip?: () => void
  ) => {
    if (!capabilities.isAvailable) {
      return;
    }

    Alert.alert(
      `Enable ${capabilities.biometricType || 'Biometric'} Login`,
      `Would you like to use ${capabilities.biometricType || 'biometric authentication'} for quick and secure login?`,
      [
        {
          text: 'Not Now',
          style: 'cancel',
          onPress: onSkip,
        },
        {
          text: 'Enable',
          onPress: onEnable,
        },
      ]
    );
  };

  return {
    capabilities,
    isLoading,
    authenticate,
    isBiometricEnabled,
    enableBiometric,
    disableBiometric,
    saveCredentials,
    getStoredBiometricToken,
    saveRotatedBiometricToken,
    getOrCreateDeviceId,
    authenticateForLogin,
    promptEnableBiometric,
    checkBiometricCapabilities,
    savePINForBiometric,
    getPINForBiometric,
    clearBiometricPIN,
  };
};

export default useBiometric;