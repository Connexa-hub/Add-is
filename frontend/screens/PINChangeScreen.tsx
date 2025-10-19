import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function PINChangeScreen({ navigation }) {
  const { tokens } = useAppTheme();
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [showCurrentPin, setShowCurrentPin] = useState(false);
  const [showNewPin, setShowNewPin] = useState(false);
  const [showConfirmPin, setShowConfirmPin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors: any = {};

    if (!currentPin) {
      newErrors.currentPin = 'Current PIN is required';
    } else if (!/^\d{4,6}$/.test(currentPin)) {
      newErrors.currentPin = 'PIN must be 4-6 digits';
    }

    if (!newPin) {
      newErrors.newPin = 'New PIN is required';
    } else if (!/^\d{4,6}$/.test(newPin)) {
      newErrors.newPin = 'PIN must be 4-6 digits';
    } else if (newPin === currentPin) {
      newErrors.newPin = 'New PIN must be different from current PIN';
    }

    if (!confirmNewPin) {
      newErrors.confirmNewPin = 'Please confirm your new PIN';
    } else if (newPin !== confirmNewPin) {
      newErrors.confirmNewPin = 'PINs do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePin = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/pin/change`,
        {
          currentPin,
          newPin,
          confirmNewPin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Your transaction PIN has been changed successfully.', [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to change PIN. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.header, { backgroundColor: tokens.colors.background.default, borderBottomColor: tokens.colors.border.default }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={tokens.colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <AppText variant="h2" weight="bold">
              Change Transaction PIN
            </AppText>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={{ padding: tokens.spacing.lg }}>
            <View style={{ marginBottom: tokens.spacing.xl }}>
              <View
                style={[
                  styles.infoBox,
                  { backgroundColor: tokens.colors.primary.light, marginBottom: tokens.spacing.lg },
                ]}
              >
                <Ionicons name="information-circle" size={20} color={tokens.colors.primary.main} />
                <AppText variant="body2" color={tokens.colors.primary.main} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
                  Enter your current PIN, then create a new PIN for your account.
                </AppText>
              </View>
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="Current PIN"
                placeholder="Enter your current PIN"
                value={currentPin}
                onChangeText={(text) => {
                  setCurrentPin(text);
                  if (errors.currentPin) setErrors({ ...errors, currentPin: '' });
                }}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry={!showCurrentPin}
                error={errors.currentPin}
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={tokens.colors.text.secondary} />}
                rightIcon={
                  <TouchableOpacity onPress={() => setShowCurrentPin(!showCurrentPin)}>
                    <Ionicons
                      name={showCurrentPin ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={tokens.colors.text.secondary}
                    />
                  </TouchableOpacity>
                }
              />
            </View>

            <View style={{ marginBottom: tokens.spacing.lg }}>
              <AppInput
                label="New PIN"
                placeholder="Enter new 4-6 digit PIN"
                value={newPin}
                onChangeText={(text) => {
                  setNewPin(text);
                  if (errors.newPin) setErrors({ ...errors, newPin: '' });
                }}
                keyboardType="numeric"
                maxLength={6}
                secureTextEntry={!showNewPin}
                error={errors.newPin}
                leftIcon={<Ionicons name="lock-open-outline" size={20} color={tokens.colors.text.secondary} />}
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

            <AppButton
              onPress={handleChangePin}
              loading={loading}
              disabled={loading}
              fullWidth
              size="lg"
              style={{ marginTop: tokens.spacing.base }}
            >
              Change PIN
            </AppButton>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});
