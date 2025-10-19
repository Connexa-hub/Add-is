import React, { useState } from 'react';
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
import { AppText, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';

export default function PINSetupScreen({ navigation, route }) {
  const { tokens } = useAppTheme();
  const { onSuccess } = route.params || {};
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [loading, setLoading] = useState(false);

  const handlePINInput = (digit: string) => {
    const currentPin = step === 'enter' ? pin : confirmPin;
    
    if (currentPin.length < 4) {
      if (step === 'enter') {
        setPin(currentPin + digit);
        if (currentPin.length === 3) {
          setTimeout(() => setStep('confirm'), 300);
        }
      } else {
        const newConfirmPin = currentPin + digit;
        setConfirmPin(newConfirmPin);
        
        if (newConfirmPin.length === 4) {
          setTimeout(() => verifyAndSubmit(newConfirmPin), 300);
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 'enter') {
      setPin(pin.slice(0, -1));
    } else {
      setConfirmPin(confirmPin.slice(0, -1));
    }
  };

  const verifyAndSubmit = async (finalConfirmPin: string) => {
    if (pin !== finalConfirmPin) {
      Alert.alert('PIN Mismatch', 'The PINs you entered do not match. Please try again.', [
        {
          text: 'OK',
          onPress: () => {
            setPin('');
            setConfirmPin('');
            setStep('enter');
          },
        },
      ]);
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem('token');

      const response = await axios.post(
        `${API_BASE_URL}/pin/setup`,
        {
          pin: pin,
          confirmPin: finalConfirmPin,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', 'Your transaction PIN has been set successfully.', [
          {
            text: 'OK',
            onPress: () => {
              if (onSuccess) {
                onSuccess();
              }
              navigation.goBack();
            },
          },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Failed to set PIN. Please try again.');
      setPin('');
      setConfirmPin('');
      setStep('enter');
    } finally {
      setLoading(false);
    }
  };

  const renderPINDots = () => {
    const currentPin = step === 'enter' ? pin : confirmPin;
    return (
      <View style={styles.dotsContainer}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index < currentPin.length ? tokens.colors.primary.main : tokens.colors.neutral.gray200,
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
      ['', '0', 'back'],
    ];

    return (
      <View style={styles.keypad}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keypadRow}>
            {row.map((key, keyIndex) => {
              if (key === '') {
                return <View key={keyIndex} style={styles.key} />;
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
            Set Transaction PIN
          </AppText>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.topSection}>
          <View style={[styles.iconContainer, { backgroundColor: tokens.colors.primary.light }]}>
            <Ionicons name="lock-closed" size={48} color={tokens.colors.primary.main} />
          </View>

          <AppText variant="h3" weight="semibold" style={{ marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.sm }}>
            {step === 'enter' ? 'Create Your PIN' : 'Confirm Your PIN'}
          </AppText>

          <AppText variant="body2" color={tokens.colors.text.secondary} style={{ textAlign: 'center', paddingHorizontal: tokens.spacing.xl }}>
            {step === 'enter'
              ? 'Enter a 4-digit PIN to secure your transactions'
              : 'Re-enter your PIN to confirm'}
          </AppText>

          {renderPINDots()}
        </View>

        {renderKeypad()}

        <View style={[styles.infoBox, { backgroundColor: tokens.colors.neutral.gray100, marginTop: tokens.spacing.lg }]}>
          <Ionicons name="information-circle" size={20} color={tokens.colors.text.secondary} />
          <AppText variant="caption" color={tokens.colors.text.secondary} style={{ flex: 1, marginLeft: tokens.spacing.sm }}>
            Your PIN will be required for transactions, card reveals, and other sensitive operations.
          </AppText>
        </View>
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
  infoBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    alignItems: 'flex-start',
  },
});
