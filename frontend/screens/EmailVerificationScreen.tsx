import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { tokenService } from '../utils/tokenService';

export default function EmailVerificationScreen({ route, navigation }: any) {
  const { tokens } = useAppTheme();
  const { email, emailSent } = route.params;
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Show warning if initial email wasn't sent
  useEffect(() => {
    if (emailSent === false) {
      setError('Email service is currently unavailable. Please use the resend button or contact support@vtu247.com for assistance.');
      setCanResend(true);
      setCountdown(0);
    }
  }, [emailSent]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async () => {
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }

    if (otp.length < 6) {
      setError('Verification code must be 6 digits');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/verify-email`, { email, otp });

      if (res.data.success && res.data.data.token) {
        // Validate token is a string
        const token = res.data.data.token;
        if (typeof token !== 'string' || !token) {
          setError('Invalid authentication token received. Please try again.');
          return;
        }

        // Store auth data
        await tokenService.setToken(token);
        await AsyncStorage.multiSet([
          ['userId', res.data.data.user?.id || ''],
          ['userEmail', res.data.data.user?.email || ''],
          ['userName', res.data.data.user?.name || ''],
          ['lastActivityTime', Date.now().toString()]
        ]);

        // Check if initial setup is complete
        AsyncStorage.getItem('initialSetupComplete').then((setupComplete) => {
          if (!setupComplete) {
            // New user - show setup screen
            navigation.replace('InitialSetup', {
              userId: res.data.data.user.id,
              email: res.data.data.user.email,
              token: res.data.data.token
            });
          } else {
            // Existing user - go to main
            if (navigation?.reset) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'Main' }],
              });
            }
          }
        });
      } else {
        navigation.navigate('Login');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/resend-verification`, { email });

      // Check if email was actually sent
      if (response.data.success) {
        setCountdown(60);
        setCanResend(false);
        // Show success message
        setError('');
      }
    } catch (err: any) {
      const errorData = err.response?.data;

      // Show specific error messages based on error code
      if (errorData?.errorCode === 'EMAIL_SERVICE_UNAVAILABLE') {
        setError(`Email service is currently unavailable. Please contact ${errorData.supportEmail || 'support@vtu247.com'} for manual verification.`);
      } else if (errorData?.errorCode === 'EMAIL_SEND_FAILED') {
        setError(`Failed to send verification email. Please contact ${errorData.supportEmail || 'support@vtu247.com'} for assistance.`);
      } else {
        setError(errorData?.message || 'Could not resend code. Please try again or contact support.');
      }
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { padding: tokens.spacing.lg }]}>
            <View style={{ marginBottom: tokens.spacing['2xl'] }}>
              <View style={[styles.iconContainer, { 
                backgroundColor: tokens.colors.success.light,
                marginBottom: tokens.spacing.lg,
                width: 80,
                height: 80,
                borderRadius: tokens.radius.lg
              }]}>
                <Ionicons name="mail" size={40} color={tokens.colors.success.main} />
              </View>

              <AppText variant="h1" weight="bold" style={{ marginBottom: tokens.spacing.sm }}>
                Verify Your Email
              </AppText>
              <AppText variant="body1" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.sm }}>
                We've sent a 6-digit verification code to
              </AppText>
              <AppText variant="subtitle1" weight="semibold" color={tokens.colors.primary.main}>
                {email}
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Verification Code"
                placeholder="Enter 6-digit code"
                value={otp}
                onChangeText={(text: string) => {
                  setOtp(text.replace(/[^0-9]/g, ''));
                  if (error) setError('');
                }}
                keyboardType="number-pad"
                maxLength={6}
                error={error}
                leftIcon={<Ionicons name="key-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <AppButton
              onPress={handleVerify}
              loading={loading}
              disabled={loading || otp.length < 6}
              fullWidth
              size="lg"
            >
              Verify Email
            </AppButton>

            <View style={[styles.resendContainer, { marginTop: tokens.spacing.xl }]}>
              {!canResend ? (
                <View style={styles.timerContainer}>
                  <Ionicons name="time-outline" size={16} color={tokens.colors.text.secondary} />
                  <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginLeft: tokens.spacing.xs }}>
                    Resend code in {countdown}s
                  </AppText>
                </View>
              ) : (
                <View style={styles.resendRow}>
                  <AppText variant="body2" color={tokens.colors.text.secondary}>
                    Didn't receive the code? <AppText variant="subtitle2" color={tokens.colors.primary.main} onPress={resendLoading ? undefined : handleResend}>{resendLoading ? 'Sending...' : 'Resend'}</AppText>
                  </AppText>
                </View>
              )}
            </View>

            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={[styles.backButton, { marginTop: tokens.spacing.base }]}
            >
              <Ionicons name="arrow-back" size={16} color={tokens.colors.text.secondary} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginLeft: tokens.spacing.xs }}>
                Back to Login
              </AppText>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  resendContainer: {
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});