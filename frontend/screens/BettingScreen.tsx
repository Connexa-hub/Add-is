
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

interface BettingProvider {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const BETTING_COLORS: { [key: string]: string } = {
  'bet9ja': '#00A651',
  'sportybet': '#E74C3C',
  '1xbet': '#0051BA',
  'betway': '#231F20',
  default: '#6B7280'
};

export default function BettingScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providers, setProviders] = useState<BettingProvider[]>([]);
  const [errors, setErrors] = useState({ userId: '', amount: '' });
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'pending' | 'failed'>('processing');
  const [transactionReference, setTransactionReference] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

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
        `${API_BASE_URL}/api/vtu/products?category=betting`
      );

      if (response.data.success && response.data.data.products) {
        const uniqueProviders = new Map<string, BettingProvider>();
        
        response.data.data.products.forEach((product: any) => {
          const providerId = product.serviceID || product.network?.toLowerCase();
          if (providerId && !uniqueProviders.has(providerId)) {
            uniqueProviders.set(providerId, {
              id: providerId,
              name: product.network || formatProviderName(providerId),
              color: BETTING_COLORS[providerId] || BETTING_COLORS.default,
              icon: 'trophy',
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
      const fallbackProviders: BettingProvider[] = [
        { id: 'bet9ja', name: 'Bet9ja', color: '#00A651', icon: 'trophy' },
        { id: 'sportybet', name: 'SportyBet', color: '#E74C3C', icon: 'trophy' },
      ];
      setProviders(fallbackProviders);
      setSelectedProvider('bet9ja');
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

  const validateUserId = (id: string) => {
    return id.length >= 6 && id.length <= 20;
  };

  const validateAmount = (amt: string) => {
    const numAmount = parseFloat(amt);
    return numAmount >= 100 && numAmount <= 100000;
  };

  const handleFundWallet = () => {
    let hasError = false;
    const newErrors = { userId: '', amount: '' };

    if (!validateUserId(userId)) {
      newErrors.userId = 'Please enter a valid user ID';
      hasError = true;
    }

    if (!validateAmount(amount)) {
      newErrors.amount = 'Amount must be between ₦100 and ₦100,000';
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    setShowPaymentPreview(true);
  };

  const confirmFunding = async (usedCashback: number) => {
    setShowPaymentPreview(false);
    setShowProcessing(true);
    setPaymentStatus('processing');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/services/betting`,
        {
          customerId: userId,
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
      console.error('Funding error:', error);
      
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
          Fund Betting Wallet
        </AppText>
      </View>

      <BannerCarousel section="betting" />

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
                  <AppText variant="caption" weight="semibold" style={{ marginTop: tokens.spacing.xs, textAlign: 'center' }}>
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

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppInput
            label="User ID / Customer ID"
            placeholder="Enter your betting account ID"
            value={userId}
            onChangeText={(text) => {
              setUserId(text);
              if (errors.userId) setErrors({ ...errors, userId: '' });
            }}
            error={errors.userId}
            leftIcon={<Ionicons name="person" size={20} color={tokens.colors.text.secondary} />}
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
            Minimum: ₦100 | Maximum: ₦100,000
          </AppText>
        </View>

        {amount && userId && (
          <View
            style={{
              backgroundColor: tokens.colors.primary.light,
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.lg,
              marginBottom: tokens.spacing.lg,
            }}
          >
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.xs }}>
              Funding Summary
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Provider: {providers.find(p => p.id === selectedProvider)?.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              User ID: {userId}
            </AppText>
            <AppText variant="h3" weight="bold" color={tokens.colors.primary.main} style={{ marginTop: tokens.spacing.xs }}>
              Total: ₦{parseFloat(amount).toLocaleString()}
            </AppText>
          </View>
        )}

        <AppButton
          onPress={handleFundWallet}
          loading={loading}
          disabled={loading || loadingProviders || !userId || !amount}
          fullWidth
          size="lg"
        >
          Continue to Payment
        </AppButton>
      </ScrollView>

      <PaymentPreviewSheet
        visible={showPaymentPreview}
        onClose={() => setShowPaymentPreview(false)}
        onConfirm={confirmFunding}
        amount={parseFloat(amount || '0')}
        serviceType="betting"
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} Wallet Funding`}
        recipient={userId}
        balance={walletBalance}
        onAddFunds={handleAddFunds}
      />

      <PaymentProcessingScreen
        visible={showProcessing}
        status={paymentStatus}
        amount={parseFloat(amount || '0')}
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} Wallet Funding`}
        recipient={userId}
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
});
