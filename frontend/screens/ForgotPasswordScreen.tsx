import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView } from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function ForgotPasswordScreen({ navigation }) {
  const { tokens } = useAppTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendResetCode = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axios.post(`${API_BASE_URL}/api/auth/forgot-password`, { email });
      navigation.navigate('ResetPassword', { email });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please try again.');
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
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { padding: tokens.spacing.lg }]}>
            <View style={{ marginBottom: tokens.spacing['2xl'] }}>
              <View style={[styles.iconContainer, { 
                backgroundColor: tokens.colors.warning.light,
                marginBottom: tokens.spacing.lg,
                width: 80,
                height: 80,
                borderRadius: tokens.radius.lg
              }]}>
                <Ionicons name="lock-open" size={40} color={tokens.colors.warning.main} />
              </View>
              
              <AppText variant="h1" weight="bold" style={{ marginBottom: tokens.spacing.sm }}>
                Forgot Password?
              </AppText>
              <AppText variant="body1" color={tokens.colors.text.secondary}>
                No worries! Enter your email address and we'll send you a code to reset your password.
              </AppText>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Email Address"
                placeholder="Enter your email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (error) setError('');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                error={error}
                leftIcon={<Ionicons name="mail-outline" size={20} color={tokens.colors.text.secondary} />}
              />
            </View>

            <AppButton
              onPress={handleSendResetCode}
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
            >
              Send Reset Code
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
