
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
import { PaymentPreviewSheet, PaymentProcessingScreen, BannerCarousel } from '../src/components/molecules';
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

const PROVIDER_COLORS: { [key: string]: string } = {
  'ikeja-electric': '#FF6B35',
  'eko-electric': '#004E89',
  'abuja-electric': '#00A878',
  'portharcourt-electric': '#9B59B6',
  'kano-electric': '#F59E0B',
  'ibadan-electric': '#8B5CF6',
  'kaduna-electric': '#06B6D4',
  default: '#6B7280'
};

export default function ElectricityScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [meterNumber, setMeterNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedMeterType, setSelectedMeterType] = useState('prepaid');
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providers, setProviders] = useState<ElectricityProvider[]>([]);
  const [errors, setErrors] = useState({ meterNumber: '', amount: '' });
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'pending' | 'failed'>('processing');
  const [transactionReference, setTransactionReference] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  const meterTypes: MeterType[] = [
    { id: 'prepaid', name: 'Prepaid', description: 'Pay as you use' },
    { id: 'postpaid', name: 'Postpaid', description: 'Monthly billing' },
  ];

  useEffect(() => {
    fetchWalletBalance();
    fetchProviders();
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

  const fetchProviders = async () => {
    setLoadingProviders(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/products?category=electricity-bill`
      );

      if (response.data.success && response.data.data.products) {
        const uniqueProviders = new Map<string, ElectricityProvider>();
        
        response.data.data.products.forEach((product: any) => {
          const providerId = product.serviceID || product.network?.toLowerCase();
          if (providerId && !uniqueProviders.has(providerId)) {
            uniqueProviders.set(providerId, {
              id: providerId,
              name: product.network || formatProviderName(providerId),
              color: PROVIDER_COLORS[providerId] || PROVIDER_COLORS.default,
              icon: 'flash',
            });
          }
        });

        const providerList = Array.from(uniqueProviders.values());
        setProviders(providerList);
        
        if (providerList.length > 0 && !selectedProvider) {
          setSelectedProvider(providerList[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      const fallbackProviders: ElectricityProvider[] = [
        { id: 'ikeja-electric', name: 'Ikeja Electric', color: '#FF6B35', icon: 'flash' },
        { id: 'eko-electric', name: 'Eko Electric', color: '#004E89', icon: 'flash' },
        { id: 'abuja-electric', name: 'Abuja Electric', color: '#00A878', icon: 'flash' },
        { id: 'portharcourt-electric', name: 'PH Electric', color: '#9B59B6', icon: 'flash' },
      ];
      setProviders(fallbackProviders);
      setSelectedProvider('ikeja-electric');
    } finally {
      setLoadingProviders(false);
    }
  };

  const formatProviderName = (id: string): string => {
    return id
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
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
          timeout: 30000,
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

      <BannerCarousel section="electricity" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.lg }}>
        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Provider
          </AppText>
          {loadingProviders ? (
            <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
                Loading providers...
              </AppText>
            </View>
          ) : (
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
                  <AppText variant="caption" weight="semibold" style={{ marginTop: tokens.spacing.xs, textAlign: 'center' }} numberOfLines={2}>
                    {provider.name}
                  </AppText>
                  {selectedProvider === provider.id && (
                    <View style={{ marginTop: 4 }}>
                      <Ionicons name="checkmark-circle" size={16} color={tokens.colors.primary.main} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
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
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View>
                    <AppText variant="subtitle2" weight="semibold">
                      {type.name}
                    </AppText>
                    <AppText variant="caption" color={tokens.colors.text.secondary}>
                      {type.description}
                    </AppText>
                  </View>
                  {selectedMeterType === type.id && (
                    <Ionicons name="checkmark-circle" size={20} color={tokens.colors.primary.main} />
                  )}
                </View>
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
              Total: ₦{parseFloat(amount).toLocaleString()}
            </AppText>
          </View>
        )}

        <AppButton
          onPress={handlePayment}
          loading={loading}
          disabled={loading || loadingProviders || !meterNumber || !amount}
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
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} - ${meterTypes.find(t => t.id === selectedMeterType)?.name}`}
        recipient={meterNumber}
        balance={walletBalance}
        onAddFunds={handleAddFunds}
      />

      <PaymentProcessingScreen
        visible={showProcessing}
        status={paymentStatus}
        amount={parseFloat(amount || '0')}
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} Bill Payment`}
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
    justifyContent: 'flex-start',
    gap: 12,
  },
  providerCard: {
    width: '30%',
    padding: 12,
    alignItems: 'center',
  },
  providerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  meterTypeContainer: {
    width: '100%',
  },
  meterTypeCard: {
    width: '100%',
  },
});
