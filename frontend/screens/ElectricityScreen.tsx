
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

interface ElectricityProvider {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface MeterType {
  id: string;
  name: string;
  description: string;
}

export default function ElectricityScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('ikeja-electric');
  const [selectedMeterType, setSelectedMeterType] = useState('prepaid');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ meterNumber: '', amount: '' });

  const providers: ElectricityProvider[] = [
    { id: 'ikeja-electric', name: 'Ikeja Electric', color: '#FF6B35', icon: 'flash' },
    { id: 'eko-electric', name: 'Eko Electric', color: '#004E89', icon: 'flash' },
    { id: 'abuja-electric', name: 'Abuja Electric', color: '#00A878', icon: 'flash' },
    { id: 'portharcourt-electric', name: 'PH Electric', color: '#9B59B6', icon: 'flash' },
  ];

  const meterTypes: MeterType[] = [
    { id: 'prepaid', name: 'Prepaid', description: 'Pay as you use' },
    { id: 'postpaid', name: 'Postpaid', description: 'Monthly billing' },
  ];

  const validateMeterNumber = (meter: string) => {
    const meterRegex = /^[0-9]{10,13}$/;
    return meterRegex.test(meter);
  };

  const validateAmount = (amt: string) => {
    const numAmount = parseFloat(amt);
    return numAmount >= 500 && numAmount <= 50000;
  };

  const handlePayment = async () => {
    let hasError = false;
    const newErrors = { meterNumber: '', amount: '' };

    if (!validateMeterNumber(meterNumber)) {
      newErrors.meterNumber = 'Please enter a valid 10-13 digit meter number';
      hasError = true;
    }

    if (!validateAmount(amount)) {
      newErrors.amount = 'Amount must be between ₦500 and ₦50,000';
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/services/pay-electricity`,
        {
          meterNumber,
          variation_code: selectedMeterType,
          serviceID: selectedProvider,
          amount: parseFloat(amount),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success',
        `Electricity payment successful! Token has been sent to meter ${meterNumber}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to process payment. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { backgroundColor: tokens.colors.primary.main, paddingTop: 50 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <AppText variant="h2" weight="bold" color="#FFFFFF">
          Pay Electricity
        </AppText>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.lg }}>
        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Provider
          </AppText>
          <View style={styles.providerGrid}>
            {providers.map((provider) => (
              <Pressable
                key={provider.id}
                style={[
                  styles.providerCard,
                  {
                    backgroundColor: tokens.colors.background.paper,
                    borderWidth: 2,
                    borderColor: selectedProvider === provider.id
                      ? tokens.colors.primary.main
                      : tokens.colors.border.default,
                    borderRadius: tokens.radius.lg,
                    ...tokens.shadows.sm,
                  }
                ]}
                onPress={() => setSelectedProvider(provider.id)}
              >
                <View style={[styles.providerIcon, { backgroundColor: provider.color }]}>
                  <Ionicons name={provider.icon as any} size={24} color="#FFFFFF" />
                </View>
                <AppText variant="caption" weight="semibold" style={{ marginTop: tokens.spacing.xs, textAlign: 'center' }}>
                  {provider.name}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Meter Type
          </AppText>
          <View style={styles.meterTypeContainer}>
            {meterTypes.map((type) => (
              <Pressable
                key={type.id}
                style={[
                  styles.meterTypeCard,
                  {
                    backgroundColor: tokens.colors.background.paper,
                    borderWidth: 2,
                    borderColor: selectedMeterType === type.id
                      ? tokens.colors.primary.main
                      : tokens.colors.border.default,
                    borderRadius: tokens.radius.lg,
                    padding: tokens.spacing.md,
                    marginBottom: tokens.spacing.sm,
                    ...tokens.shadows.sm,
                  }
                ]}
                onPress={() => setSelectedMeterType(type.id)}
              >
                <AppText variant="subtitle2" weight="semibold">
                  {type.name}
                </AppText>
                <AppText variant="caption" color={tokens.colors.text.secondary}>
                  {type.description}
                </AppText>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppInput
            label="Meter Number"
            placeholder="1234567890"
            value={meterNumber}
            onChangeText={(text) => {
              setMeterNumber(text);
              if (errors.meterNumber) setErrors({ ...errors, meterNumber: '' });
            }}
            keyboardType="number-pad"
            maxLength={13}
            error={errors.meterNumber}
            leftIcon={<Ionicons name="card" size={20} color={tokens.colors.text.secondary} />}
          />
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppInput
            label="Amount (₦)"
            placeholder="1000"
            value={amount}
            onChangeText={(text) => {
              setAmount(text);
              if (errors.amount) setErrors({ ...errors, amount: '' });
            }}
            keyboardType="number-pad"
            error={errors.amount}
            leftIcon={<Ionicons name="cash" size={20} color={tokens.colors.text.secondary} />}
          />
          <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.xs }}>
            Minimum: ₦500 | Maximum: ₦50,000
          </AppText>
        </View>

        {amount && meterNumber && (
          <View
            style={{
              backgroundColor: tokens.colors.primary.light,
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.lg,
              marginBottom: tokens.spacing.lg,
            }}
          >
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.xs }}>
              Payment Summary
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Provider: {providers.find(p => p.id === selectedProvider)?.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Meter Type: {meterTypes.find(t => t.id === selectedMeterType)?.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Meter Number: {meterNumber}
            </AppText>
            <AppText variant="h3" weight="bold" color={tokens.colors.primary.main} style={{ marginTop: tokens.spacing.xs }}>
              Total: ₦{amount}
            </AppText>
          </View>
        )}

        <AppButton
          onPress={handlePayment}
          loading={loading}
          disabled={loading || !meterNumber || !amount}
          fullWidth
          size="lg"
        >
          {loading ? 'Processing...' : 'Pay Electricity Bill'}
        </AppButton>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 16,
  },
  providerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  providerCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meterTypeContainer: {
    flexDirection: 'column',
  },
  meterTypeCard: {
    marginBottom: 8,
  },
});
