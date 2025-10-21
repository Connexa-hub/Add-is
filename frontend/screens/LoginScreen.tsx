
import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../components/atoms';
import { useAppTheme } from '../hooks/useAppTheme';

export default function LoginScreen({ navigation }) {
  const { tokens } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

  const validateEmail = (email) => {
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
        const isFirstLogin = res.data.data.first_login;
        if (isFirstLogin) {
          navigation.replace('Settings', { setupMode: true });
        } else {
          navigation.replace('Main');
        }
      }
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.requiresVerification) {
        navigation.navigate('EmailVerification', { email });
      } else {
        setErrors({ email: '', password: errorData?.message || 'Login failed' });
      }
    } finally {
      setLoading(false);
    }
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
            <Image source={require('../assets/images/splash-icon.png')} style={styles.logo} />

            <View style={styles.form}>
              <AppInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />

              <AppInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                error={errors.password}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={24} color="gray" />
                  </TouchableOpacity>
                }
              />

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
                <AppText style={styles.forgotPassword}>Forgot Password?</AppText>
              </TouchableOpacity>

              <AppButton onPress={handleLogin} loading={loading} fullWidth>
                Login
              </AppButton>
            </View>

            <View style={styles.footer}>
              <AppText>Don't have an account? </AppText>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <AppText style={{ color: tokens.colors.primary.main }}>Create a new account</AppText>
              </TouchableOpacity>
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
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 40,
  },
  form: {
    width: '100%',
  },
  forgotPassword: {
    textAlign: 'right',
    marginVertical: 10,
  },
  footer: {
    flexDirection: 'row',
    marginTop: 20,
  },
});
