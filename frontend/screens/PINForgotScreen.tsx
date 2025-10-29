
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppButton, AppInput } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function PINForgotScreen({ navigation }) {
  const { tokens } = useAppTheme();
  const [step, setStep] = useState<'request' | 'verify' | 'reset'>('request');
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [errors, setErrors] = useState({
    otp: '',
    newPin: '',
    confirmNewPin: ''
  });

  const handleRequestReset = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/pin/forgot/request`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMaskedEmail(response.data.data.email);
        setStep('verify');
        Alert.alert('Success', response.data.message);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ ...errors, otp: 'Please enter a valid 6-digit code' });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/pin/forgot/verify`,
        { otp },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setResetToken(response.data.data.resetToken);
        setStep('reset');
        Alert.alert('Success', 'OTP verified! Now set your new PIN');
      }
    } catch (error) {
      setErrors({ ...errors, otp: error.response?.data?.message || 'Invalid code' });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPin = async () => {
    setErrors({ otp: '', newPin: '', confirmNewPin: '' });

    if (!newPin || !/^\d{4,6}$/.test(newPin)) {
      setErrors({ ...errors, newPin: 'PIN must be 4-6 digits' });
      return;
    }

    if (newPin !== confirmNewPin) {
      setErrors({ ...errors, confirmNewPin: 'PINs do not match' });
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/pin/forgot/reset`,
        {
          resetToken,
          newPin,
          confirmNewPin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Your transaction PIN has been reset successfully!', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to reset PIN');
    } finally {
      setLoading(false);
    }
  };

  const renderRequestStep = () => (
    <View style={{ padding: tokens.spacing.lg }}>
      <View style={[styles.iconContainer, { backgroundColor: tokens.colors.primary.light }]}>
        <Ionicons name="lock-closed" size={48} color={tokens.colors.primary.main} />
      </View>

      <AppText variant="h2" weight="bold" style={{ textAlign: 'center', marginTop: tokens.spacing.lg }}>
        Forgot Transaction PIN?
      </AppText>

      <AppText
        variant="body1"
        color={tokens.colors.text.secondary}
        style={{ textAlign: 'center', marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.xl }}
      >
        We'll send a verification code to your registered email address to reset your PIN
      </AppText>

      <View
        style={[
          styles.infoBox,
          { backgroundColor: tokens.colors.info.light, marginBottom: tokens.spacing.xl },
        ]}
      >
        <Ionicons name="information-circle" size={20} color={tokens.colors.info.main} />
        <AppText variant="body2" color={tokens.colors.info.main} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
          Make sure you have access to your registered email
        </AppText>
      </View>

      <AppButton onPress={handleRequestReset} loading={loading} disabled={loading} fullWidth size="lg">
        Send Reset Code
      </AppButton>
    </View>
  );

  const renderVerifyStep = () => (
    <View style={{ padding: tokens.spacing.lg }}>
      <View style={[styles.iconContainer, { backgroundColor: tokens.colors.primary.light }]}>
        <Ionicons name="mail" size={48} color={tokens.colors.primary.main} />
      </View>

      <AppText variant="h2" weight="bold" style={{ textAlign: 'center', marginTop: tokens.spacing.lg }}>
        Enter Verification Code
      </AppText>

      <AppText
        variant="body1"
        color={tokens.colors.text.secondary}
        style={{ textAlign: 'center', marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.xl }}
      >
        We sent a 6-digit code to {maskedEmail}
      </AppText>

      <View style={{ marginBottom: tokens.spacing.lg }}>
        <AppInput
          label="Verification Code"
          placeholder="Enter 6-digit code"
          value={otp}
          onChangeText={(text) => {
            setOtp(text);
            if (errors.otp) setErrors({ ...errors, otp: '' });
          }}
          keyboardType="numeric"
          maxLength={6}
          error={errors.otp}
          leftIcon={<Ionicons name="shield-checkmark-outline" size={20} color={tokens.colors.text.secondary} />}
        />
      </View>

      <AppButton onPress={handleVerifyOTP} loading={loading} disabled={loading} fullWidth size="lg">
        Verify Code
      </AppButton>

      <TouchableOpacity
        style={{ marginTop: tokens.spacing.lg, alignItems: 'center' }}
        onPress={handleRequestReset}
        disabled={loading}
      >
        <AppText variant="body2" color={tokens.colors.primary.main}>
          Didn't receive code? Resend
        </AppText>
      </TouchableOpacity>
    </View>
  );

  const renderResetStep = () => (
    <View style={{ padding: tokens.spacing.lg }}>
      <View style={[styles.iconContainer, { backgroundColor: tokens.colors.success.light }]}>
        <Ionicons name="checkmark-circle" size={48} color={tokens.colors.success.main} />
      </View>

      <AppText variant="h2" weight="bold" style={{ textAlign: 'center', marginTop: tokens.spacing.lg }}>
        Create New PIN
      </AppText>

      <AppText
        variant="body1"
        color={tokens.colors.text.secondary}
        style={{ textAlign: 'center', marginTop: tokens.spacing.sm, marginBottom: tokens.spacing.xl }}
      >
        Choose a new 4-6 digit PIN for your transactions
      </AppText>

      <View style={{ marginBottom: tokens.spacing.lg }}>
        <AppInput
          label="New PIN"
          placeholder="Enter new PIN"
          value={newPin}
          onChangeText={(text) => {
            setNewPin(text);
            if (errors.newPin) setErrors({ ...errors, newPin: '' });
          }}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry={!showNewPin}
          error={errors.newPin}
          leftIcon={<Ionicons name="lock-closed-outline" size={20} color={tokens.colors.text.secondary} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowNewPin(!showNewPin)}>
              <Ionicons
                name={showNewPin ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={tokens.colors.text.secondary}
              />
            </TouchableOpacity>
          }
        />
      </View>

      <View style={{ marginBottom: tokens.spacing.lg }}>
        <AppInput
          label="Confirm New PIN"
          placeholder="Re-enter new PIN"
          value={confirmNewPin}
          onChangeText={(text) => {
            setConfirmNewPin(text);
            if (errors.confirmNewPin) setErrors({ ...errors, confirmNewPin: '' });
          }}
          keyboardType="numeric"
          maxLength={6}
          secureTextEntry={!showConfirmPin}
          error={errors.confirmNewPin}
          leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={tokens.colors.text.secondary} />}
          rightIcon={
            <TouchableOpacity onPress={() => setShowConfirmPin(!showConfirmPin)}>
              <Ionicons
                name={showConfirmPin ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={tokens.colors.text.secondary}
              />
            </TouchableOpacity>
          }
        />
      </View>

      <AppButton onPress={handleResetPin} loading={loading} disabled={loading} fullWidth size="lg">
        Reset PIN
      </AppButton>
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
        <View style={[styles.header, { borderBottomColor: tokens.colors.border.default }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <AppText variant="h3" weight="bold">
              Reset Transaction PIN
            </AppText>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {step === 'request' && renderRequestStep()}
          {step === 'verify' && renderVerifyStep()}
          {step === 'reset' && renderResetStep()}
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    marginRight: 40,
  },
  scrollView: {
    flex: 1,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
