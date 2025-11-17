import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { BiometricModal, NetworkErrorCard } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useBiometric } from '../hooks/useBiometric';
import { tokenService } from '../utils/tokenService';
import { useNetwork } from '../contexts/NetworkContext';

export default function LoginScreen({ navigation }) {
  const { tokens } = useAppTheme();
  const { isOnline, checkConnection } = useNetwork();
  const {
    capabilities,
    isLoading: isBiometricLoading,
    authenticateForLogin,
    enableBiometric,
    isBiometricEnabled,
    saveCredentials,
  } = useBiometric();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricConfigured, setBiometricConfigured] = useState(false);
  const [savedEmail, setSavedEmail] = useState(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingBiometricData, setPendingBiometricData] = useState(null);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [networkError, setNetworkError] = useState({ visible: false, message: '', type: 'network_error' });
  const [pendingAction, setPendingAction] = useState(null);
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    if (!isBiometricLoading && !hasCheckedSession.current) {
      hasCheckedSession.current = true;
      checkBiometricStatus();
      checkSavedCredentials();
      checkSessionReauth();
    }
  }, [isBiometricLoading]);

  const checkSessionReauth = async () => {
    try {
      // Check if user has valid token but session timed out
      const token = await SecureStore.getItemAsync('auth_token');
      const biometricEnabled = await isBiometricEnabled();

      console.log('checkSessionReauth - Token exists:', !!token, 'Biometric enabled:', biometricEnabled);

      if (token) {
        // User has a token, verify if it's still valid
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

          const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` },
            signal: controller.signal
          });

          clearTimeout(timeoutId);

          if (response.data.success) {
            // Token is valid, navigate to main
            console.log('Valid session found - navigating to Main');
            navigation.replace('Main');
            return;
          }
        } catch (error) {
          // Token expired or validation failed
          console.log('Session validation failed:', error.message);
          // Clear the auth token from all locations, keep biometric settings
          await SecureStore.deleteItemAsync('auth_token');
          await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName', 'lastActivityTime']);
        }
      }

      // CRITICAL: Always check for biometric settings after token validation
      // This ensures biometric UI shows up after logout or session expiry
      const saved = await AsyncStorage.getItem('savedEmail');
      const biometricUserId = await AsyncStorage.getItem('biometric_user_id');
      const biometricEnabledFlag = await AsyncStorage.getItem('biometricEnabled');

      console.log('Biometric check - Saved email:', saved, 'Enabled:', biometricEnabledFlag, 'UserId:', biometricUserId);

      // Verify that we have BOTH the enabled flag AND actual credentials
      if (biometricEnabledFlag === 'true' && saved && biometricUserId) {
        // Double-check that biometric token exists in secure storage
        const hasToken = await SecureStore.getItemAsync(`biometric_credentials_${biometricUserId}`);

        if (hasToken) {
          console.log('✅ Biometric credentials found - showing biometric login UI');
          setBiometricConfigured(true);
          setSavedEmail(saved);
          setEmail(saved);
          setShowPasswordLogin(false); // ALWAYS show biometric UI if configured
        } else {
          // Biometric is marked as enabled but token is missing - clear settings
          console.log('❌ Biometric token missing - clearing biometric settings');
          await AsyncStorage.multiRemove(['biometricEnabled', 'biometric_user_id', 'savedEmail']);
          setBiometricConfigured(false);
          setShowPasswordLogin(true);
        }
      } else {
        console.log('ℹ️ Biometric not configured - showing password login');
        setBiometricConfigured(false);
        setShowPasswordLogin(true);
      }
    } catch (error) {
      console.error('Error in checkSessionReauth:', error);
      setShowPasswordLogin(true);
    }
  };

  const checkBiometricStatus = async () => {
    if (!isBiometricLoading) {
      setBiometricAvailable(capabilities.isAvailable);
      const enabled = await isBiometricEnabled();
      const saved = await AsyncStorage.getItem('savedEmail');
      const userId = await AsyncStorage.getItem('biometric_user_id');

      // Only mark as configured if we have all required data
      if (enabled && saved && userId) {
        const hasToken = await SecureStore.getItemAsync(`biometric_credentials_${userId}`);
        setBiometricConfigured(!!hasToken);
      } else {
        setBiometricConfigured(false);
      }
    }
  };

  const checkSavedCredentials = async () => {
    try {
      const saved = await AsyncStorage.getItem('savedEmail');
      if (saved) {
        setSavedEmail(saved);
        setEmail(saved);
      }
    } catch (error) {
      console.error('Error checking saved credentials:', error);
    }
  };

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const isNetworkError = (error: any) => {
    // Check if it's a network-related error
    if (error.code === 'ECONNABORTED' || error.message === 'canceled') {
      return { isNetwork: true, type: 'timeout' as const };
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return { isNetwork: true, type: 'network_error' as const };
    }
    if (!error.response && error.request) {
      return { isNetwork: true, type: 'network_error' as const };
    }
    if (error.response && error.response.status >= 500) {
      return { isNetwork: true, type: 'server_error' as const };
    }
    return { isNetwork: false, type: undefined };
  };

  const showNetworkError = (errorType: 'network_error' | 'timeout' | 'server_error' = 'network_error', customMessage: string = '') => {
    setNetworkError({
      visible: true,
      message: customMessage,
      type: errorType,
    });
  };

  const handleRetryLogin = async () => {
    setNetworkError({ visible: false, message: '', type: 'network_error' });

    // Retry the pending action
    if (pendingAction === 'biometric') {
      await handleBiometricLogin();
    } else if (pendingAction === 'password') {
      await handleLogin();
    }
  };

  const handleDismissError = () => {
    setNetworkError({ visible: false, message: '', type: 'network_error' });
    setPendingAction(null);
  };

  const handleBiometricLogin = async () => {
    if (!savedEmail) {
      Alert.alert('Error', 'No saved credentials found');
      return;
    }

    if (loading) {
      console.log('Login already in progress, skipping duplicate request');
      return;
    }

    try {
      setLoading(true);

      // First, authenticate with biometric
      const result = await authenticateForLogin();

      if (!result.success) {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Biometric authentication failed'
        );
        setLoading(false);
        return;
      }

      if (!result.biometricToken) {
        setShowPasswordLogin(true);
        setLoading(false);
        Alert.alert(
          'Re-authentication Required',
          'Your biometric credentials have expired. Please login with your email and password.',
          [{ text: 'OK' }]
        );
        return;
      }

      // After successful biometric auth, login to backend
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await axios.post(
          `${API_BASE_URL}/api/auth/biometric-login`, 
          { biometricToken: result.biometricToken },
          { signal: controller.signal }
        );

        clearTimeout(timeoutId);

        if (response.data.success && response.data.data.token) {
          const userId = response.data.data.user?.id || '';
          const userEmail = response.data.data.user?.email || '';
          const userName = response.data.data.user?.name || '';
          const token = response.data.data.token;

          console.log('Biometric login successful, storing credentials...');

          // Critical: Store token FIRST using tokenService
          await tokenService.setToken(token);

          // Then store other data
          await AsyncStorage.multiSet([
            ['userId', userId],
            ['userEmail', userEmail],
            ['userName', userName],
            ['savedEmail', userEmail],
            ['lastActivityTime', Date.now().toString()]
          ]);

          // Verify token was actually stored
          const storedToken = await tokenService.getToken();
          const asyncToken = await AsyncStorage.getItem('token');

          console.log('Token storage verification:', {
            secureStoreHasToken: !!storedToken,
            asyncStorageHasToken: !!asyncToken
          });

          if (!storedToken || !asyncToken) {
            throw new Error('Failed to store authentication token properly');
          }

          console.log('Token verified, navigating to Main...');

          // Small delay to ensure storage is complete
          await new Promise(resolve => setTimeout(resolve, 200));

          // Clear any login flags
          await AsyncStorage.removeItem('user_logged_out');

          // Use reset to prevent back navigation to login
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });

          setLoading(false);
        } else {
          throw new Error('Login failed - invalid response');
        }
      } catch (loginError) {
        console.error('Biometric login error:', loginError);
        setLoading(false);

        // Check if it's a network error
        const networkErrorCheck = isNetworkError(loginError);
        if (networkErrorCheck.isNetwork) {
          setPendingAction('biometric');
          showNetworkError(networkErrorCheck.type);
          return;
        }

        // Clear invalid tokens but KEEP biometric credentials
        await tokenService.clearToken();
        await AsyncStorage.removeItem('token');

        // User just needs to re-login, not re-setup biometric
        setShowPasswordLogin(true);
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login with your email and password. You can use biometric login again after logging in.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      setLoading(false);

      // Check if it's a network error
      const networkErrorCheck = isNetworkError(error);
      if (networkErrorCheck.isNetwork) {
        setPendingAction('biometric');
        showNetworkError(networkErrorCheck.type);
        return;
      }

      Alert.alert('Error', 'An error occurred during biometric login');
    }
  };

  const handleEnableBiometric = async () => {
    if (!pendingBiometricData) return;

    try {
      setLoading(true);
      console.log('Enabling biometric for user:', pendingBiometricData.userId);

      const success = await enableBiometric(
        pendingBiometricData.userId,
        pendingBiometricData.token
      );

      if (success) {
        console.log('Biometric enabled successfully, saving credentials');
        await saveCredentials(pendingBiometricData.userId, pendingBiometricData.email);
        setShowBiometricModal(false);
        setPendingBiometricData(null);

        Alert.alert(
          'Success!',
          `${capabilities.biometricType || 'Biometric'} login has been enabled. You can now use it to login.`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Don't auto-navigate - user should use biometric to login
                setShowBiometricModal(false);
                setPendingBiometricData(null);
                // Show biometric login UI
                setBiometricConfigured(true);
              },
            },
          ]
        );
      } else {
        Alert.alert('Error', 'Failed to enable biometric authentication');
      }
    } catch (error) {
      console.error('Error enabling biometric:', error);
      Alert.alert('Error', 'Failed to enable biometric authentication');
    } finally {
      setLoading(false);
    }
  };

  const handleSkipBiometric = () => {
    console.log('User skipped biometric setup');
    setShowBiometricModal(false);
    setPendingBiometricData(null);

    // User chose to skip biometric, redirect to login
    // They need to login normally next time
    Alert.alert(
      'Biometric Skipped',
      'You can enable biometric login later in Settings. Please login with your credentials.',
      [
        {
          text: 'OK',
          onPress: () => {
            setShowPasswordLogin(true);
          }
        }
      ]
    );
  };

  const handleLogin = async () => {
    if (loading) {
      console.log('Login already in progress, skipping duplicate request');
      return;
    }

    let hasErrors = false;
    const newErrors = { email: '', password: '' };

    if (!email) {
      newErrors.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
      hasErrors = true;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (hasErrors) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/login`, { 
        email, 
        password 
      });

      if (res.data.success && res.data.data.token) {
        const userId = res.data.data.user?.id || '';
        const userEmail = res.data.data.user?.email || '';
        const userName = res.data.data.user?.name || '';
        const token = res.data.data.token;

        // Store auth data
        await tokenService.setToken(token);
        await AsyncStorage.multiSet([
          ['userId', userId],
          ['userEmail', userEmail],
          ['userName', userName],
          ['savedEmail', email],
          ['lastActivityTime', Date.now().toString()]
        ]);

        // Check if biometric should be offered
        if (capabilities.isAvailable) {
          const biometricEnabled = await isBiometricEnabled();

          if (!biometricEnabled) {
            // Show biometric setup modal for first-time users
            setPendingBiometricData({
              userId: userId,
              email: userEmail,
              token: token,
            });
            setShowBiometricModal(true);
            return; // Don't navigate yet, wait for modal response
          }
        }

        // Navigate to main app
        if (navigation?.reset) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
          });
        }
      }
    } catch (err) {
      // Check if it's a network error first
      const networkErrorCheck = isNetworkError(err);
      if (networkErrorCheck.isNetwork) {
        setPendingAction('password');
        showNetworkError(networkErrorCheck.type);
        setLoading(false);
        return;
      }

      const errorData = err.response?.data;

      if (errorData?.requiresVerification && errorData?.email) {
        navigation.navigate('EmailVerification', { email: errorData.email });
        return;
      }

      if (errorData?.accountNotFound) {
        Alert.alert(
          'Account Not Found',
          'No account exists with this email address. Would you like to create a new account?',
          [
            {
              text: 'Cancel',
              style: 'cancel'
            },
            {
              text: 'Sign Up',
              onPress: () => navigation.navigate('Register')
            }
          ]
        );
        return;
      }

      // Handle rate limiting errors
      if (err.response?.status === 429) {
        const remainingTime = errorData?.remainingTime;
        const timeMessage = remainingTime 
          ? remainingTime > 60 
            ? `${Math.ceil(remainingTime / 60)} minutes`
            : `${remainingTime} seconds`
          : 'a few minutes';

        Alert.alert(
          'Too Many Attempts',
          `Please wait ${timeMessage} before trying again. This is a security measure to protect your account.`,
          [{ text: 'OK' }]
        );
        return;
      }

      setErrors({
        email: '',
        password: errorData?.message || 'Login failed. Please check your credentials.'
      });
    } finally {
      setLoading(false);
    }
  };

  const getMaskedEmail = () => {
    if (!savedEmail) return '';
    const atIndex = savedEmail.indexOf('@');
    if (atIndex > 3) {
      return savedEmail.substring(0, 3) + '****' + savedEmail.substring(atIndex);
    }
    return savedEmail;
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { padding: tokens.spacing.lg }]}>
            {/* Logo */}
            <View style={[styles.logoContainer, { 
              marginTop: tokens.spacing.lg, 
              marginBottom: tokens.spacing.xl 
            }]}>
              <Image
                source={require('../assets/images/splash-icon.png')}
                style={{ width: 100, height: 100 }}
                resizeMode="contain"
              />
            </View>

            {/* Biometric Login Section - Only show if configured and not showing password form */}
            {biometricConfigured && biometricAvailable && savedEmail && !showPasswordLogin && (
              <View style={styles.biometricSection}>
                {/* User Avatar */}
                <View style={[styles.avatarContainer, { 
                  backgroundColor: tokens.colors.background.paper,
                  marginBottom: tokens.spacing.lg,
                  width: 100,
                  height: 100,
                  borderRadius: 50,
                  ...tokens.shadows.md
                }]}>
                  <Ionicons name="person" size={50} color={tokens.colors.text.secondary} />
                </View>

                {/* Masked Email */}
                <AppText 
                  variant="h3" 
                  weight="semibold" 
                  style={{ marginBottom: tokens.spacing['2xl'] }}
                >
                  {getMaskedEmail()}
                </AppText>

                {/* Biometric Icon */}
                <TouchableOpacity
                  onPress={handleBiometricLogin}
                  disabled={loading}
                  activeOpacity={0.7}
                  style={[styles.biometricIcon, { 
                    backgroundColor: tokens.colors.background.paper,
                    width: 120,
                    height: 120,
                    borderRadius: 60,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: tokens.spacing.lg,
                    ...tokens.shadows.md
                  }]}
                >
                  <Ionicons name="finger-print" size={64} color={tokens.colors.primary.main} />
                </TouchableOpacity>

                <AppText 
                  variant="h3" 
                  weight="semibold"
                  style={{ marginBottom: tokens.spacing.sm, textAlign: 'center' }}
                >
                  Welcome Back
                </AppText>

                <AppText 
                  variant="body2" 
                  color={tokens.colors.text.secondary} 
                  style={{ marginBottom: tokens.spacing.xl, textAlign: 'center' }}
                >
                  Tap the fingerprint icon to login with {capabilities.biometricType || 'biometric'}
                </AppText>

                <AppButton
                  variant="primary"
                  onPress={handleBiometricLogin}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                  size="lg"
                  style={{ marginBottom: tokens.spacing.base, maxWidth: 300 }}
                  icon={<Ionicons name="finger-print" size={24} color="#fff" />}
                >
                  Login with {capabilities.biometricType || 'Biometric'}
                </AppButton>

                {/* Alternative login options */}
                <View style={[styles.alternativeOptions, { 
                  flexDirection: 'row', 
                  gap: tokens.spacing.lg, 
                  marginBottom: tokens.spacing['2xl'] 
                }]}>
                  <TouchableOpacity onPress={async () => {
                    // ONLY clear biometric credentials when explicitly switching accounts
                    await AsyncStorage.multiRemove([
                      'savedEmail',
                      'biometricEnabled',
                      'biometric_user_id'
                    ]);
                    const userId = await AsyncStorage.getItem('userId');
                    if (userId) {
                      await SecureStore.deleteItemAsync(`biometric_credentials_${userId}`);
                    }
                    setSavedEmail(null);
                    setEmail('');
                    setBiometricConfigured(false);
                    setShowPasswordLogin(true);
                  }}>
                    <AppText variant="body2" color={tokens.colors.primary.main}>
                      Switch Account
                    </AppText>
                  </TouchableOpacity>
                  <AppText variant="body2" color={tokens.colors.text.secondary}>|</AppText>
                  <TouchableOpacity onPress={() => setShowPasswordLogin(true)}>
                    <AppText variant="body2" color={tokens.colors.primary.main}>
                      Login with Password
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Password Login Form - Show if no biometric or user wants password login */}
            {(!biometricConfigured || !savedEmail || showPasswordLogin) && (
              <View style={styles.passwordLoginSection}>
                <View style={{ marginBottom: tokens.spacing['2xl'], marginTop: tokens.spacing['2xl'] }}>
                  <AppText 
                    variant="h2" 
                    weight="bold" 
                    style={{ marginBottom: tokens.spacing.sm }}
                  >
                    Welcome Back
                  </AppText>
                  <AppText 
                    variant="body1" 
                    color={tokens.colors.text.secondary} 
                    style={{ marginBottom: tokens.spacing.xl }}
                  >
                    Sign in to continue to your account
                  </AppText>
                </View>

                <View style={{ marginBottom: tokens.spacing.lg }}>
                  <AppInput
                    label="Email Address"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (errors.email) setErrors({ ...errors, email: '' });
                    }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    error={errors.email}
                    editable={!loading}
                    leftIcon={<Ionicons name="mail-outline" size={20} color={tokens.colors.text.secondary} />}
                  />
                </View>

                <View style={{ marginBottom: tokens.spacing.base }}>
                  <AppInput
                    label="Password"
                    placeholder="Enter your password"
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (errors.password) setErrors({ ...errors, password: '' });
                    }}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    autoComplete="password"
                    error={errors.password}
                    editable={!loading}
                    leftIcon={<Ionicons name="lock-closed-outline" size={20} color={tokens.colors.text.secondary} />}
                    rightIcon={
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} activeOpacity={0.7}>
                        <Ionicons 
                          name={showPassword ? "eye-off-outline" : "eye-outline"} 
                          size={20} 
                          color={tokens.colors.text.secondary} 
                        />
                      </TouchableOpacity>
                    }
                  />
                </View>

                <TouchableOpacity 
                  onPress={() => navigation.navigate('ForgotPassword')}
                  style={{ alignSelf: 'flex-end', marginBottom: tokens.spacing.lg }}
                >
                  <AppText variant="subtitle2" color={tokens.colors.primary.main}>
                    Forgot Password?
                  </AppText>
                </TouchableOpacity>

                <AppButton
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                  size="lg"
                >
                  Sign In
                </AppButton>

                {biometricConfigured && biometricAvailable && savedEmail && showPasswordLogin && (
                  <AppButton
                    variant="outline"
                    onPress={() => setShowPasswordLogin(false)}
                    disabled={loading}
                    fullWidth
                    size="lg"
                    style={{ marginTop: tokens.spacing.md }}
                    icon={<Ionicons name="finger-print" size={20} color={tokens.colors.primary.main} />}
                  >
                    Use {capabilities.biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric'}
                  </AppButton>
                )}

                <View style={[styles.footer, { marginTop: tokens.spacing.xl }]}>
                  <AppText variant="body2" color={tokens.colors.text.secondary}>
                    Don't have an account?{' '}
                  </AppText>
                  <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                    <AppText variant="subtitle2" color={tokens.colors.primary.main}>
                      Sign Up
                    </AppText>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Biometric Setup Modal */}
      <BiometricModal
        visible={showBiometricModal}
        onEnable={handleEnableBiometric}
        onSkip={handleSkipBiometric}
        biometricType={capabilities.biometricType || 'Biometric'}
      />

      {/* Network Error Card */}
      <NetworkErrorCard
        visible={networkError.visible}
        message={networkError.message}
        errorType={networkError.type}
        onRetry={handleRetryLogin}
        onDismiss={handleDismissError}
        position="top"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
  },
  biometricSection: {
    alignItems: 'center',
    width: '100%',
  },
  passwordLoginSection: {
    width: '100%',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricIcon: {
    // TouchableOpacity styles are inline
  },
  alternativeOptions: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});