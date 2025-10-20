
import React, { useState, useEffect } from 'react';
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
import { PaymentPreviewSheet, PaymentProcessingScreen } from '../src/components/molecules';
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
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'pending' | 'failed'>('processing');
  const [transactionReference, setTransactionReference] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

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

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  const fetchWalletBalance = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/auth/profile`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success && response.data.data) {
        setWalletBalance(response.data.data.walletBalance || 0);
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
    }
  };

  const validateMeterNumber = (meter: string) => {
    const meterRegex = /^[0-9]{10,13}$/;
    return meterRegex.test(meter);
  };

  const validateAmount = (amt: string) => {
    const numAmount = parseFloat(amt);
    return numAmount >= 500 && numAmount <= 50000;
  };

  const handlePayment = () => {
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

    setShowPaymentPreview(true);
  };

  const confirmPayment = async (usedCashback: number) => {
    setShowPaymentPreview(false);
    setShowProcessing(true);
    setPaymentStatus('processing');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/services/pay-electricity`,
        {
          meterNumber,
          variation_code: selectedMeterType,
          serviceID: selectedProvider,
          amount: parseFloat(amount),
          usedCashback,
        },
        { 
          headers: { Authorization: `Bearer ${token}` },
          timeout: 30000, // 30 second timeout
        }
      );

      if (response.data.success) {
        setTransactionReference(response.data.data.transaction.reference);
        setPaymentStatus('success');
        await fetchWalletBalance();
      } else {
        setPaymentStatus('failed');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      
      // Check if it's a network/timeout error
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout') || error.message.includes('Network')) {
        setPaymentStatus('pending');
      } else {
        setPaymentStatus('failed');
      }
    }
  };

  const handleProcessingClose = () => {
    setShowProcessing(false);
    if (paymentStatus === 'success' || paymentStatus === 'pending') {
      navigation.goBack();
    }
  };

  const handleRetry = () => {
    setShowProcessing(false);
    setShowPaymentPreview(true);
  };

  const handleAddFunds = () => {
    setShowPaymentPreview(false);
    navigation.navigate('WalletFunding' as never);
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
          Continue to Payment
        </AppButton>
      </ScrollView>

      <PaymentPreviewSheet
        visible={showPaymentPreview}
        onClose={() => setShowPaymentPreview(false)}
        onConfirm={confirmPayment}
        amount={parseFloat(amount || '0')}
        serviceType="electricity"
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} - ${meterTypes.find(t => t.id === selectedMeterType)?.name || ''}`}
        recipient={meterNumber}
        balance={walletBalance}
        onAddFunds={handleAddFunds}
      />

      <PaymentProcessingScreen
        visible={showProcessing}
        status={paymentStatus}
        amount={parseFloat(amount || '0')}
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} Electricity`}
        recipient={meterNumber}
        reference={transactionReference}
        onClose={handleProcessingClose}
        onRetry={handleRetry}
      />
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
