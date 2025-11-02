import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, SafeAreaView, Image } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function RegisterScreen({ navigation }) {
  const { tokens } = useAppTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', confirmPassword: '', terms: '' });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const passwordStrength = useMemo(() => {
    if (!password) return { level: 0, text: '', color: tokens.colors.neutral.gray400 };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;

    if (strength <= 2) return { level: 1, text: 'Weak', color: tokens.colors.error.main };
    if (strength <= 3) return { level: 2, text: 'Fair', color: tokens.colors.warning.main };
    if (strength <= 4) return { level: 3, text: 'Good', color: tokens.colors.success.main };
    return { level: 4, text: 'Strong', color: tokens.colors.success.dark };
  }, [password, tokens]);

  const handleRegister = async () => {
    let hasErrors = false;
    const newErrors = { name: '', email: '', password: '', confirmPassword: '', terms: '' };

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      hasErrors = true;
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      hasErrors = true;
    }

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

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      hasErrors = true;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
      hasErrors = true;
    }

    setErrors(newErrors);

    if (hasErrors) return;

    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        name, 
        email, 
        password
      });
      navigation.navigate('EmailVerification', { email });
    } catch (err) {
      const errorData = err.response?.data;
      
      if (errorData?.requiresVerification && errorData?.email) {
        navigation.navigate('EmailVerification', { email: errorData.email });
        return;
      }
      
      setErrors({
        ...errors,
        email: errorData?.message || 'Registration failed. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
          >
            <View style={{ padding: tokens.spacing.lg }}>
              <View style={{ marginBottom: tokens.spacing.lg, marginTop: tokens.spacing.md }}>
                <View style={[styles.iconContainer, { 
                  marginBottom: tokens.spacing.md,
                  width: 60,
                  height: 60,
                  alignItems: 'center',
                  justifyContent: 'center'
                }]}>
                  <Image
                    source={require('../assets/images/splash-icon.png')}
                    style={{ width: 60, height: 60 }}
                    resizeMode="contain"
                  />
                </View>

                <AppText variant="h1" weight="bold" style={{ marginBottom: tokens.spacing.sm }}>
                  Create Account
                </AppText>
                <AppText variant="body1" color={tokens.colors.text.secondary}>
                  Sign up to get started
                </AppText>
              </View>

              <View style={{ marginBottom: tokens.spacing.lg }}>
                <AppInput
                  label="Full Name"
                  placeholder="Enter your full name"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  autoCapitalize="words"
                  error={errors.name}
                  leftIcon={<Ionicons name="person-outline" size={20} color={tokens.colors.text.secondary} />}
                />
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
                  leftIcon={<Ionicons name="mail-outline" size={20} color={tokens.colors.text.secondary} />}
                />
              </View>

              <View style={{ marginBottom: tokens.spacing.sm }}>
                <AppInput
                  label="Password"
                  placeholder="Create a password"
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (errors.password) setErrors({ ...errors, password: '' });
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
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

              {password.length > 0 && (
                <View style={{ marginBottom: tokens.spacing.lg }}>
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

              <TouchableOpacity 
                style={[styles.checkboxContainer, { marginBottom: tokens.spacing.base }]}
                onPress={() => {
                  setAgreeToTerms(!agreeToTerms);
                  if (errors.terms) setErrors({ ...errors, terms: '' });
                }}
              >
                <View style={[
                  styles.checkbox,
                  { 
                    borderColor: errors.terms ? tokens.colors.error.main : tokens.colors.border.default,
                    backgroundColor: agreeToTerms ? tokens.colors.primary.main : 'transparent'
                  }
                ]}>
                  {agreeToTerms && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </View>
                <AppText variant="body2" color={tokens.colors.text.secondary} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                  I agree to the <AppText variant="body2" color={tokens.colors.primary.main}>Terms and Conditions</AppText>
                </AppText>
              </TouchableOpacity>

              {errors.terms && (
                <AppText variant="caption" color={tokens.colors.error.main} style={{ marginBottom: tokens.spacing.base }}>
                  {errors.terms}
                </AppText>
              )}

              <AppButton
                onPress={handleRegister}
                loading={loading}
                disabled={loading}
                fullWidth
                size="lg"
              >
                Create Account
              </AppButton>

              <View style={[styles.footer, { marginTop: tokens.spacing.xl }]}>
                <AppText variant="body2" color={tokens.colors.text.secondary}>
                  Already have an account? <AppText variant="subtitle2" color={tokens.colors.primary.main} onPress={() => navigation.navigate('Login')}>Sign In</AppText>
                </AppText>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});