import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, SafeAreaView } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function ResetPasswordScreen({ route, navigation }) {
  const { tokens } = useAppTheme();
  const { email } = route.params;
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ otp: '', password: '', confirmPassword: '' });

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { level: 0, text: '', color: tokens.colors.neutral.gray400 };

    let strength = 0;
    if (newPassword.length >= 8) strength++;
    if (/[a-z]/.test(newPassword)) strength++;
    if (/[A-Z]/.test(newPassword)) strength++;
    if (/[0-9]/.test(newPassword)) strength++;
    if (/[^a-zA-Z0-9]/.test(newPassword)) strength++;

    if (strength <= 2) return { level: 1, text: 'Weak', color: tokens.colors.error.main };
    if (strength <= 3) return { level: 2, text: 'Fair', color: tokens.colors.warning.main };
    if (strength <= 4) return { level: 3, text: 'Good', color: tokens.colors.success.main };
    return { level: 4, text: 'Strong', color: tokens.colors.success.dark };
  }, [newPassword, tokens]);

  const passwordRequirements = [
    { text: 'At least 8 characters', met: newPassword.length >= 8 },
    { text: 'One lowercase letter', met: /[a-z]/.test(newPassword) },
    { text: 'One uppercase letter', met: /[A-Z]/.test(newPassword) },
    { text: 'One number', met: /[0-9]/.test(newPassword) },
    { text: 'One special character', met: /[^a-zA-Z0-9]/.test(newPassword) },
  ];

  const handleReset = async () => {
    let hasErrors = false;
    const newErrors = { otp: '', password: '', confirmPassword: '' };

    if (!otp) {
      newErrors.otp = 'Verification code is required';
      hasErrors = true;
    } else if (otp.length < 6) {
      newErrors.otp = 'Verification code must be 6 digits';
      hasErrors = true;
    }

    if (!newPassword) {
      newErrors.password = 'Password is required';
      hasErrors = true;
    } else if (newPassword.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      hasErrors = true;
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (hasErrors) return;

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/auth/reset-password`, {
        email,
        otp,
        newPassword
      });
      navigation.navigate('Login');
    } catch (err) {
      setErrors({
        ...errors,
        otp: err.response?.data?.message || 'Reset failed. Please check your code and try again.'
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.container, { padding: tokens.spacing.lg }]}>
              <View style={{ marginBottom: tokens.spacing.xl }}>
                <View style={[styles.iconContainer, { 
                  backgroundColor: tokens.colors.info.light,
                  marginBottom: tokens.spacing.lg,
                  width: 80,
                  height: 80,
                  borderRadius: tokens.radius.lg
                }]}>
                  <Ionicons name="key" size={40} color={tokens.colors.info.main} />
                </View>

                <AppText variant="h1" weight="bold" style={{ marginBottom: tokens.spacing.sm }}>
                  Reset Password
                </AppText>
                <AppText variant="body1" color={tokens.colors.text.secondary}>
                  Enter the verification code sent to {email} and create a new password.
                </AppText>
              </View>

              <View style={{ marginBottom: tokens.spacing.lg }}>
                <AppInput
                  label="Verification Code"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChangeText={(text) => {
                    setOtp(text.replace(/[^0-9]/g, ''));
                    if (errors.otp) setErrors({ ...errors, otp: '' });
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  error={errors.otp}
                  leftIcon={<Ionicons name="key-outline" size={20} color={tokens.colors.text.secondary} />}
                />
              </View>

              <View style={{ marginBottom: tokens.spacing.sm }}>
                <AppInput
                  label="New Password"
                  placeholder="Create a new password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  error={errors.password}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={tokens.colors.text.secondary} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                      <Ionicons 
                        name={showPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={tokens.colors.text.secondary} 
                      />
                    </TouchableOpacity>
                  }
                />
              </View>

              {newPassword.length > 0 && (
                <View style={{ marginBottom: tokens.spacing.base }}>
                  <View style={styles.strengthContainer}>
                    <AppText variant="caption" color={tokens.colors.text.secondary}>
                      Password Strength:{' '}
                    </AppText>
                    <AppText variant="caption" weight="semibold" color={passwordStrength.color}>
                      {passwordStrength.text}
                    </AppText>
                  </View>
                  <View style={[styles.strengthBar, { backgroundColor: tokens.colors.neutral.gray200 }]}>
                    <View 
                      style={[
                        styles.strengthFill,
                        { 
                          width: `${(passwordStrength.level / 4) * 100}%`,
                          backgroundColor: passwordStrength.color 
                        }
                      ]} 
                    />
                  </View>
                </View>
              )}

              {newPassword.length > 0 && (
                <View style={{ marginBottom: tokens.spacing.lg }}>
                  <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginBottom: tokens.spacing.xs }}>
                    Password Requirements:
                  </AppText>
                  {passwordRequirements.map((req, index) => (
                    <View key={index} style={styles.requirementRow}>
                      <Ionicons 
                        name={req.met ? "checkmark-circle" : "ellipse-outline"} 
                        size={16} 
                        color={req.met ? tokens.colors.success.main : tokens.colors.neutral.gray400} 
                      />
                      <AppText 
                        variant="caption" 
                        color={req.met ? tokens.colors.text.primary : tokens.colors.text.secondary}
                        style={{ marginLeft: tokens.spacing.xs }}
                      >
                        {req.text}
                      </AppText>
                    </View>
                  ))}
                </View>
              )}

              <View style={{ marginBottom: tokens.spacing.lg }}>
                <AppInput
                  label="Confirm Password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  error={errors.confirmPassword}
                  leftIcon={<Ionicons name="lock-closed-outline" size={20} color={tokens.colors.text.secondary} />}
                  rightIcon={
                    <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                      <Ionicons 
                        name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                        size={20} 
                        color={tokens.colors.text.secondary} 
                      />
                    </TouchableOpacity>
                  }
                />
              </View>

              <AppButton
                onPress={handleReset}
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
              >
                Reset Password
              </AppButton>

              <TouchableOpacity 
                onPress={() => navigation.navigate('Login')}
                style={[styles.backButton, { marginTop: tokens.spacing.xl }]}
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
  },
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  strengthBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});