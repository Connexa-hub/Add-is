import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../constants/api';
import { AppText } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { useBiometric } from '../hooks/useBiometric';

export default function PINVerifyScreen({ navigation, route }) {
  const { tokens } = useAppTheme();
  const { capabilities, authenticate, isBiometricEnabled } = useBiometric();
  const { title, message, onSuccess } = route.params || {};
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [biometricAvailable, setBiometricAvailable] = useState(false);

  useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const enabled = await isBiometricEnabled();
    setBiometricAvailable(enabled && capabilities.isAvailable);
  };

  const handlePINInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      
      if (newPin.length === 4) {
        setTimeout(() => verifyPIN(newPin), 300);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleBiometricAuth = async () => {
    try {
      setLoading(true);
      setError('');

      const authResult = await authenticate(
        title || 'Verify Your Identity',
        'Cancel'
      );

      if (authResult.success) {
        if (onSuccess) {
          onSuccess();
        }
        navigation.goBack();
      } else {
        setError(authResult.error || 'Authentication failed');
        Alert.alert(
          'Authentication Failed',
          authResult.error || 'Please try again or enter your PIN',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      setError('Biometric authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const verifyPIN = async (finalPin: string) => {
    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/pin/verify`,
        {
          pin: finalPin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        if (onSuccess) {
          onSuccess();
        }
        navigation.goBack();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Invalid PIN. Please try again.';
      const remainingAttempts = error.response?.data?.remainingAttempts;

      setError(errorMessage);
      setPin('');

      if (error.response?.status === 429) {
        Alert.alert('Account Locked', errorMessage, [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]);
      } else if (remainingAttempts !== undefined) {
        Alert.alert('Incorrect PIN', `${errorMessage}\nRemaining attempts: ${remainingAttempts}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPINDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index < pin.length
                    ? error
                      ? tokens.colors.error.main
                      : tokens.colors.primary.main
                    : tokens.colors.neutral.gray200,
                borderColor: error ? tokens.colors.error.main : 'transparent',
                borderWidth: error ? 1 : 0,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const renderKeypad = () => {
    const keys = [
      ['1', '2', '3'],
      ['4', '5', '6'],
      ['7', '8', '9'],
      [biometricAvailable ? 'biometric' : '', '0', 'back'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.key} />;
              }

              if (key === 'biometric') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleBiometricAuth}
                    disabled={loading}
                  >
                    <Ionicons 
                      name="finger-print" 
                      size={32} 
                      color={tokens.colors.primary.main} 
                    />
                  </TouchableOpacity>
                );
              }

              if (key === 'back') {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={styles.key}
                    onPress={handleBackspace}
                    disabled={loading}
                  >
                    <Ionicons name="backspace-outline" size={28} color={tokens.colors.text.primary} />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={styles.key}
                  onPress={() => handlePINInput(key)}
                  disabled={loading}
                >
                  <AppText variant="h1" weight="semibold">
                    {key}
                  </AppText>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { borderBottomColor: tokens.colors.border.default }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <AppText variant="h2" weight="bold">
            Enter PIN
          </AppText>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={[styles.iconContainer, { backgroundColor: tokens.colors.primary.light }]}>
            <Ionicons name="lock-closed" size={48} color={tokens.colors.primary.main} />
          </View>

          <AppText variant="h3" weight="semibold" style={{ marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.sm }}>
            {title || 'Verify Your Identity'}
          </AppText>

          <AppText variant="body2" color={tokens.colors.text.secondary} style={{ textAlign: 'center', paddingHorizontal: tokens.spacing.xl }}>
            {message || 'Enter your 4-digit transaction PIN'}
          </AppText>

          {renderPINDots()}

          {error && (
            <AppText variant="body2" color={tokens.colors.error.main} style={{ marginTop: tokens.spacing.base, textAlign: 'center' }}>
              {error}
            </AppText>
          )}
        </View>

        {renderKeypad()}

        <TouchableOpacity
          style={{ marginTop: tokens.spacing.lg, alignItems: 'center' }}
          onPress={() => navigation.navigate('PINChange')}
        >
          <AppText variant="body2" color={tokens.colors.primary.main}>
            Forgot PIN?
          </AppText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    marginRight: 8,
  },
  headerTextContainer: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  keypad: {
    marginTop: 40,
  },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  key: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
