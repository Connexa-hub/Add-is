
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { BiometricModal } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useBiometric } from '../hooks/useBiometric';

export default function LoginScreen({ navigation }) {
  const { tokens } = useAppTheme();
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

  useEffect(() => {
    checkBiometricStatus();
    checkSavedCredentials();
    // Verify session is still valid on mount
    verifySession();
  }, [capabilities, isBiometricLoading]);

  const verifySession = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        // Verify token is still valid
        const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!response.data.success) {
          // Token invalid, clear session
          await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName']);
          setEmail('');
          setSavedEmail(null);
          setBiometricConfigured(false);
        }
      }
    } catch (error) {
      // Session expired or invalid, clear it
      await AsyncStorage.multiRemove(['token', 'userId', 'userEmail', 'userName']);
      setEmail('');
      setSavedEmail(null);
      setBiometricConfigured(false);
    }
  };

  const checkBiometricStatus = async () => {
    if (!isBiometricLoading) {
      setBiometricAvailable(capabilities.isAvailable);
      const enabled = await isBiometricEnabled();
      setBiometricConfigured(enabled);
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

  const handleBiometricLogin = async () => {
    if (!savedEmail) {
      Alert.alert('Error', 'No saved credentials found');
      return;
    }

    try {
      setLoading(true);

      const result = await authenticateForLogin();

      if (!result.success) {
        Alert.alert(
          'Authentication Failed',
          result.error || 'Please login with your email and password'
        );
        setLoading(false);
        return;
      }

      // Get fresh token after biometric auth
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('userId');
      
      if (token && userId) {
        // Verify token is still valid
        try {
          const response = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if (response.data.success) {
            navigation.replace('Main');
          } else {
            throw new Error('Token invalid');
          }
        } catch (verifyError) {
          Alert.alert(
            'Session Expired',
            'Please login with your email and password',
            [
              {
                text: 'OK',
                onPress: async () => {
                  await AsyncStorage.multiRemove(['biometricEnabled', 'savedEmail', 'token', 'userId']);
                  setEmail('');
                  setSavedEmail(null);
                  setBiometricConfigured(false);
                },
              },
            ]
          );
        }
      } else {
        Alert.alert(
          'Session Expired',
          'Please login with your email and password',
          [
            {
              text: 'OK',
              onPress: async () => {
                await AsyncStorage.multiRemove(['biometricEnabled', 'savedEmail', 'token', 'userId']);
                setEmail('');
                setSavedEmail(null);
                setBiometricConfigured(false);
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Biometric login error:', error);
      Alert.alert('Error', 'An error occurred during biometric login');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableBiometric = async () => {
    if (!pendingBiometricData) return;
    
    const success = await enableBiometric(pendingBiometricData.userId);
    if (success) {
      await saveCredentials(pendingBiometricData.userId, pendingBiometricData.userEmail);
      Alert.alert(
        'Success',
        `${capabilities.biometricType || 'Biometric'} login enabled! You can now login quickly using your ${capabilities.biometricType?.toLowerCase() || 'biometric'}.`
      );
    }
    setShowBiometricModal(false);
    navigation.replace('Main');
  };

  const handleSkipBiometric = () => {
    setShowBiometricModal(false);
    navigation.replace('Main');
  };

  const handleLogin = async () => {
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

        await AsyncStorage.multiSet([
          ['token', res.data.data.token],
          ['userId', userId],
          ['userEmail', userEmail],
          ['userName', userName],
          ['savedEmail', email]
        ]);

        const savedToken = await AsyncStorage.getItem('token');
        if (savedToken) {
          const biometricEnabled = await isBiometricEnabled();

          if (!biometricEnabled && capabilities.isAvailable) {
            setPendingBiometricData({ userId, userEmail });
            setShowBiometricModal(true);
          } else {
            navigation.replace('Main');
          }
        } else {
          setErrors({
            email: '',
            password: 'Failed to save session. Please try again.'
          });
        }
      }
    } catch (err) {
      const errorData = err.response?.data;

      if (errorData?.requiresVerification && errorData?.email) {
        navigation.navigate('EmailVerification', { email: errorData.email });
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
              marginTop: tokens.spacing.md, 
              marginBottom: tokens.spacing.lg 
            }]}>
              <Image
                source={require('../assets/images/splash-icon.png')}
                style={{ width: 60, height: 60 }}
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
                <View style={[styles.biometricIcon, { 
                  backgroundColor: tokens.colors.background.paper,
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: tokens.spacing.base,
                  ...tokens.shadows.md
                }]}>
                  <Ionicons name="finger-print" size={50} color={tokens.colors.primary.main} />
                </View>

                <AppText 
                  variant="body1" 
                  color={tokens.colors.primary.main} 
                  style={{ marginBottom: tokens.spacing.md }}
                >
                  Click to log in with {capabilities.biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric'}
                </AppText>

                <AppButton
                  variant="primary"
                  onPress={handleBiometricLogin}
                  loading={loading}
                  disabled={loading}
                  fullWidth
                  size="lg"
                  style={{ marginBottom: tokens.spacing.xl, maxWidth: 300 }}
                >
                  Verify {capabilities.biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric'}
                </AppButton>

                {/* Alternative login options */}
                <View style={[styles.alternativeOptions, { 
                  flexDirection: 'row', 
                  gap: tokens.spacing.lg, 
                  marginBottom: tokens.spacing['2xl'] 
                }]}>
                  <TouchableOpacity onPress={() => {
                    setSavedEmail(null);
                    setEmail('');
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

      {/* Biometric Modal */}
      <BiometricModal
        visible={showBiometricModal}
        onEnable={handleEnableBiometric}
        onSkip={handleSkipBiometric}
        biometricType={capabilities.biometricType || 'Biometric'}
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
    alignItems: 'center',
    justifyContent: 'center',
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
