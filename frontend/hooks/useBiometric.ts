import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
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

const requestBiometricToken = async (authToken: string): Promise<string | null> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/auth/enable-biometric`,
      {},
      {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      }
    );

    if (response.data.success && response.data.data.biometricToken) {
      return response.data.data.biometricToken;
    }
    return null;
  } catch (error) {
    console.error('Error requesting biometric token:', error);
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
        fallbackLabel: 'Use Password',
        disableDeviceFallback: false,
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

      // Get token from secure storage if not provided
      let authToken = token;
      if (!authToken) {
        authToken = await SecureStore.getItemAsync('auth_token');
        if (!authToken) {
          Alert.alert('Error', 'Authentication token not found. Please login again.');
          return false;
        }
      }

      // Request biometric token from server
      const biometricToken = await requestBiometricToken(authToken);
      if (!biometricToken) {
        Alert.alert('Error', 'Failed to setup biometric authentication. Please try again.');
        return false;
      }

      // Save biometric settings
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
      await AsyncStorage.setItem('biometric_user_id', userId);
      await SecureStore.setItemAsync(`${CREDENTIALS_KEY_PREFIX}${userId}`, biometricToken);

      return true;
    } catch (error) {
      console.error('Error enabling biometric:', error);
      Alert.alert('Error', 'Failed to enable biometric authentication');
      return false;
    }
  };

  const disableBiometric = async (): Promise<boolean> => {
    try {
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

  const getStoredBiometricToken = async (userId: string): Promise<string | null> => {
    try {
      const biometricToken = await SecureStore.getItemAsync(
        `${CREDENTIALS_KEY_PREFIX}${userId}`
      );

      return biometricToken;
    } catch (error) {
      console.error('Error retrieving biometric token:', error);
      return null;
    }
  };

  const authenticateForLogin = async (): Promise<{
    success: boolean;
    biometricToken?: string;
    userId?: string;
    error?: string;
  }> => {
    try {
      const enabled = await isBiometricEnabled();
      if (!enabled) {
        return {
          success: false,
          error: 'Biometric login is not enabled',
        };
      }

      const userId = await AsyncStorage.getItem('biometric_user_id');
      if (!userId) {
        return {
          success: false,
          error: 'No biometric login configured',
        };
      }

      const authResult = await authenticate('Login with biometric', 'Cancel');
      if (!authResult.success) {
        return {
          success: false,
          error: authResult.error,
        };
      }

      const biometricToken = await getStoredBiometricToken(userId);
      if (!biometricToken) {
        return {
          success: false,
          error: 'Biometric credentials not found. Please login with email and password.',
        };
      }

      return {
        success: true,
        biometricToken,
        userId,
      };
    } catch (error) {
      console.error('Error authenticating for login:', error);
      return {
        success: false,
        error: 'An unexpected error occurred',
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
    authenticateForLogin,
    promptEnableBiometric,
    checkBiometricCapabilities,
  };
};

export default useBiometric;