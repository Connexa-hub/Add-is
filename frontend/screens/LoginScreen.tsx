import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
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
  const [savedEmail, setSavedEmail] = useState<string | null>(null);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pendingBiometricData, setPendingBiometricData] = useState<{ userId: string; userEmail: string } | null>(null);

  useEffect(() => {
    checkBiometricStatus();
    checkSavedCredentials();
  }, [capabilities, isBiometricLoading]);

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

  const validateEmail = (email: string) => {
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
        return;
      }

      const token = await AsyncStorage.getItem('token');
      if (token && result.userId) {
        navigation.replace('Main');
      } else {
        Alert.alert(
          'Session Expired',
          'Please login with your email and password',
          [
            {
              text: 'OK',
              onPress: async () => {
                await AsyncStorage.removeItem('biometricEnabled');
                await AsyncStorage.removeItem('savedEmail');
                setEmail('');
                setSavedEmail(null);
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
          ['savedEmail', email] // Save the email for biometric login
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={true}
        >
          <View style={{ padding: tokens.spacing.lg }}>
            <View style={{ marginBottom: tokens.spacing['2xl'], marginTop: tokens.spacing['2xl'] }}>
              <View style={[styles.iconContainer, { 
                backgroundColor: tokens.colors.primary.light,
                marginBottom: tokens.spacing.lg,
                width: 80,
                height: 80,
                borderRadius: tokens.radius.lg
              }]}>
                <Ionicons name="wallet" size={40} color={tokens.colors.primary.main} />
              </View>

              <AppText variant="h1" weight="bold" style={{ marginBottom: tokens.spacing.sm }}>
                Welcome Back
              </AppText>
              <AppText variant="body1" color={tokens.colors.text.secondary}>
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
                  setSavedEmail(text); // Update savedEmail when email changes
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

          {biometricConfigured && biometricAvailable && savedEmail && (
            <AppButton
              variant="outline"
              onPress={handleBiometricLogin}
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
              style={{ marginTop: tokens.spacing.md }}
              icon={<Ionicons name="finger-print" size={20} color={tokens.colors.primary.main} />}
            >
              Login with {capabilities.biometricType === 'fingerprint' ? 'Fingerprint' : 'Biometric'}
            </AppButton>
          )}

          <View style={[styles.footer, { marginTop: tokens.spacing.xl }]}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Don't have an account? <AppText variant="subtitle2" color={tokens.colors.primary.main} onPress={() => navigation.navigate('Register')}>Sign Up</AppText>
            </AppText>
          </View>
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
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  biometricButton: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
});