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
import { PaymentPreviewSheet, PaymentProcessingScreen, BannerCarousel, BottomSheet } from '../src/components/molecules';
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
  const [showProviderSheet, setShowProviderSheet] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'pending' | 'failed'>('processing');
  const [transactionReference, setTransactionReference] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [quickAmounts, setQuickAmounts] = useState<Array<{ value: string; label: string }>>([]);
  const [loadingQuickAmounts, setLoadingQuickAmounts] = useState(false);

  const meterTypes: MeterType[] = [
    { id: 'prepaid', name: 'Prepaid', description: 'Pay as you use' },
    { id: 'postpaid', name: 'Postpaid', description: 'Monthly billing' },
  ];

  useEffect(() => {
    fetchWalletBalance();
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      fetchQuickAmounts();
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (meterNumber && amount && parseFloat(amount) >= 500 && selectedProvider && !showPaymentPreview) {
      handlePayment();
    }
  }, [meterNumber, amount, selectedProvider]);

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

        // Sort providers alphabetically A-Z by name
        const providerList = Array.from(uniqueProviders.values()).sort((a, b) => 
          a.name.localeCompare(b.name)
        );

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
      ].sort((a, b) => a.name.localeCompare(b.name));
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

  const fetchQuickAmounts = async () => {
    if (!selectedProvider) return;

    setLoadingQuickAmounts(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/quick-amounts/electricity-bill/${selectedProvider}`
      );

      if (response.data.success && response.data.data.amounts) {
        const amounts = response.data.data.amounts.map((amt: number) => ({
          value: amt.toString(),
          label: `₦${amt.toLocaleString()}`
        }));
        setQuickAmounts(amounts);
      } else {
        setQuickAmounts([
          { value: '1000', label: '₦1,000' },
          { value: '2000', label: '₦2,000' },
          { value: '3000', label: '₦3,000' },
          { value: '5000', label: '₦5,000' },
          { value: '10000', label: '₦10,000' },
          { value: '15000', label: '₦15,000' },
        ]);
      }
    } catch (error) {
      console.error('Failed to fetch quick amounts:', error);
      setQuickAmounts([
        { value: '1000', label: '₦1,000' },
        { value: '2000', label: '₦2,000' },
        { value: '3000', label: '₦3,000' },
        { value: '5000', label: '₦5,000' },
        { value: '10000', label: '₦10,000' },
        { value: '15000', label: '₦15,000' },
      ]);
    } finally {
      setLoadingQuickAmounts(false);
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

  const confirmPayment = async (usedCashback: number, biometricSuccess: boolean = false) => {
    setShowPaymentPreview(false);

    if (biometricSuccess) {
      await processPayment(usedCashback);
    } else {
      navigation.navigate('PINVerify', {
        title: 'Confirm Payment',
        message: `Enter your PIN to pay ₦${amount} for electricity`,
        onSuccess: async () => {
          await processPayment(usedCashback);
        }
      });
    }
  };

  const processPayment = async (usedCashback: number) => {
    setShowProcessing(true);
    setPaymentStatus('processing');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/services/pay-electricity`,
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
        
        // Don't auto-close, let user dismiss
      } else {
        setPaymentStatus('failed');
        setTimeout(() => {
          setShowProcessing(false);
          Alert.alert('Transaction Failed', response.data.message || 'Failed to process payment.');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Payment error:', error);

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout') || error.message?.includes('Network')) {
        setPaymentStatus('pending');
        setTimeout(() => {
          setShowProcessing(false);
          Alert.alert(
            'Transaction Pending',
            'Your transaction is being processed. Please check your transaction history.',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }, 2000);
      } else {
        setPaymentStatus('failed');
        setTimeout(() => {
          setShowProcessing(false);
          Alert.alert('Error', error.response?.data?.message || 'Failed to process payment.');
        }, 2000);
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

  const handleCleanup = () => {
    setAmount('');
    setMeterNumber('');
    setLoading(false);
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
          <Pressable
            style={[
              {
                backgroundColor: tokens.colors.background.paper,
                borderWidth: 2,
                borderColor: selectedProvider ? tokens.colors.primary.main : tokens.colors.border.default,
                borderRadius: tokens.radius.lg,
                padding: tokens.spacing.md,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                ...tokens.shadows.sm,
              }
            ]}
            onPress={() => setShowProviderSheet(true)}
          >
            {selectedProvider ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <View style={[styles.providerIcon, { backgroundColor: providers.find(p => p.id === selectedProvider)?.color || '#6B7280' }]}>
                  <Ionicons name="flash" size={20} color="#FFFFFF" />
                </View>
                <AppText variant="body1" weight="semibold" style={{ marginLeft: tokens.spacing.md }}>
                  {providers.find(p => p.id === selectedProvider)?.name}
                </AppText>
              </View>
            ) : (
              <AppText variant="body1" color={tokens.colors.text.secondary}>
                Choose electricity provider
              </AppText>
            )}
            <Ionicons name="chevron-down" size={24} color={tokens.colors.text.secondary} />
          </Pressable>
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
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Quick Amount
          </AppText>
          {loadingQuickAmounts ? (
            <View style={{ paddingVertical: tokens.spacing.md, alignItems: 'center' }}>
              <ActivityIndicator size="small" color={tokens.colors.primary.main} />
            </View>
          ) : (
            <View style={styles.quickAmountsGrid}>
              {quickAmounts.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.quickAmountCard,
                    {
                      backgroundColor: amount === item.value 
                        ? tokens.colors.primary.light 
                        : tokens.colors.background.paper,
                      borderWidth: 2,
                      borderColor: amount === item.value
                        ? tokens.colors.primary.main
                        : tokens.colors.border.default,
                      borderRadius: tokens.radius.md,
                      padding: tokens.spacing.md,
                    }
                  ]}
                  onPress={() => {
                    setAmount(item.value);
                    if (errors.amount) setErrors({ ...errors, amount: '' });
                  }}
                >
                  <AppText 
                    variant="body1" 
                    weight="semibold"
                    color={amount === item.value ? tokens.colors.primary.main : tokens.colors.text.primary}
                  >
                    {item.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppInput
            label="Custom Amount (₦)"
            placeholder="Enter custom amount"
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
        onCleanup={handleCleanup}
      />

      <PaymentProcessingScreen
        visible={showProcessing}
        status={paymentStatus}
        amount={parseFloat(amount || '0')}
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} Bill Payment`}
        recipient={meterNumber}
        reference={transactionReference}
        onClose={handleProcessingClose}
        walletBalanceBefore={walletBalance}
        walletBalanceAfter={walletBalance - parseFloat(amount || '0')}
        onRetry={handleRetry}
      />

      <BottomSheet
        visible={showProviderSheet}
        onClose={() => setShowProviderSheet(false)}
        title="Select Electricity Provider"
        height="70%"
      >
        {loadingProviders ? (
          <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={tokens.colors.primary.main} />
            <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
              Loading providers...
            </AppText>
          </View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false}>
            {providers.map((provider) => (
              <Pressable
                key={provider.id}
                style={[
                  {
                    backgroundColor: tokens.colors.background.paper,
                    borderWidth: 2,
                    borderColor: selectedProvider === provider.id
                      ? tokens.colors.primary.main
                      : tokens.colors.border.default,
                    borderRadius: tokens.radius.lg,
                    padding: tokens.spacing.md,
                    marginBottom: tokens.spacing.sm,
                    flexDirection: 'row',
                    alignItems: 'center',
                    ...tokens.shadows.sm,
                  }
                ]}
                onPress={() => {
                  setSelectedProvider(provider.id);
                  setShowProviderSheet(false);
                }}
              >
                <View style={[styles.providerIcon, { backgroundColor: provider.color }]}>
                  <Ionicons name={provider.icon as any} size={24} color="#FFFFFF" />
                </View>
                <AppText variant="body1" weight="semibold" style={{ marginLeft: tokens.spacing.md, flex: 1 }}>
                  {provider.name}
                </AppText>
                {selectedProvider === provider.id && (
                  <Ionicons name="checkmark-circle" size={24} color={tokens.colors.primary.main} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </BottomSheet>
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
  quickAmountsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAmountCard: {
    width: '31%',
    marginBottom: 12,
    alignItems: 'center',
  },
});