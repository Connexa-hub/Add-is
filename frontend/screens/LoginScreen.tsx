import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, SafeAreaView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function LoginScreen({ navigation }) {
  const { tokens } = useAppTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
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
        await AsyncStorage.setItem('token', res.data.data.token);
        navigation.replace('Main');
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

          <View style={[styles.footer, { marginTop: tokens.spacing.xl }]}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Don't have an account? <AppText variant="subtitle2" color={tokens.colors.primary.main} onPress={() => navigation.navigate('Register')}>Sign Up</AppText>
            </AppText>
          </View>
        </View>
      </ScrollView>
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
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});