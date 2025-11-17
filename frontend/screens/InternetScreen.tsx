
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

interface ISPProvider {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface InternetPlan {
  id: string;
  name: string;
  price: number;
  validity: string;
  provider: string;
}

const ISP_COLORS: { [key: string]: string } = {
  'smile-direct': '#FF6B35',
  'spectranet': '#004E89',
  'ipnx': '#00A878',
  default: '#6B7280'
};

export default function InternetScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [accountNumber, setAccountNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<InternetPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providers, setProviders] = useState<ISPProvider[]>([]);
  const [internetPlans, setInternetPlans] = useState<InternetPlan[]>([]);
  const [errors, setErrors] = useState({ accountNumber: '' });
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'pending' | 'failed'>('processing');
  const [transactionReference, setTransactionReference] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchWalletBalance();
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedProvider) {
      fetchInternetPlans();
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (accountNumber && selectedPlan && selectedProvider && !showPaymentPreview) {
      handleSubscribe();
    }
  }, [accountNumber, selectedPlan, selectedProvider]);

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
        `${API_BASE_URL}/api/vtu/products?category=other-services&type=internet`
      );

      if (response.data.success && response.data.data.products) {
        const uniqueProviders = new Map<string, ISPProvider>();
        
        response.data.data.products.forEach((product: any) => {
          const providerId = product.serviceID || product.network?.toLowerCase();
          if (providerId && !uniqueProviders.has(providerId)) {
            uniqueProviders.set(providerId, {
              id: providerId,
              name: product.network || formatProviderName(providerId),
              color: ISP_COLORS[providerId] || ISP_COLORS.default,
              icon: 'wifi',
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
      const fallbackProviders: ISPProvider[] = [
        { id: 'smile-direct', name: 'Smile Direct', color: '#FF6B35', icon: 'wifi' },
        { id: 'spectranet', name: 'Spectranet', color: '#004E89', icon: 'wifi' },
      ];
      setProviders(fallbackProviders);
      setSelectedProvider('smile-direct');
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

  const fetchInternetPlans = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/products?category=other-services&serviceID=${selectedProvider}`
      );

      if (response.data.success && response.data.data.products) {
        const plans = response.data.data.products.map((product: any) => ({
          id: product.variationCode,
          name: product.displayName || product.title,
          price: product.sellingPrice || product.faceValue,
          validity: product.validity || '30 days',
          provider: selectedProvider,
        }));
        setInternetPlans(plans);
      }
    } catch (error) {
      console.error('Failed to fetch internet plans:', error);
      Alert.alert('Error', 'Failed to load internet plans. Please try again.');
    } finally {
      setLoading(false);
    }
    setSelectedPlan(null);
  };

  const validateAccountNumber = (account: string) => {
    const accountRegex = /^[0-9]{6,15}$/;
    return accountRegex.test(account);
  };

  const handleSubscribe = async () => {
    if (!validateAccountNumber(accountNumber)) {
      setErrors({ accountNumber: 'Please enter a valid account number' });
      return;
    }

    if (!selectedPlan) {
      Alert.alert('Error', 'Please select an internet plan');
      return;
    }

    try {
      setLoading(true);

      // Check if user has PIN setup
      const token = await AsyncStorage.getItem('token');
      const pinStatusResponse = await axios.get(
        `${API_BASE_URL}/api/pin/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (pinStatusResponse.data.success && !pinStatusResponse.data.data.isPinSet) {
        setLoading(false);
        Alert.alert(
          'Set Up Transaction PIN',
          'For security, you need to set up a Transaction PIN before making purchases.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set Up PIN',
              onPress: () => {
                navigation.navigate('PINSetup', {
                  onSuccess: () => {
                    navigation.goBack();
                  }
                });
              }
            }
          ]
        );
        return;
      }

      setShowPaymentPreview(true);
    } catch (error) {
      Alert.alert('Error', 'An error occurred while verifying your PIN status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmSubscription = async (usedCashback: number, biometricSuccess: boolean = false) => {
    setShowPaymentPreview(false);

    if (biometricSuccess) {
      await processSubscription(usedCashback);
    } else {
      navigation.navigate('PINVerify', {
        title: 'Confirm Subscription',
        message: `Enter your PIN to subscribe to ${selectedPlan?.name}`,
        onSuccess: async () => {
          await processSubscription(usedCashback);
        }
      });
    }
  };

  const processSubscription = async (usedCashback: number) => {
    setShowProcessing(true);
    setPaymentStatus('processing');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/services/internet`,
        {
          accountNumber,
          variation_code: selectedPlan!.id,
          serviceID: selectedProvider,
          amount: selectedPlan!.price,
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

        setTimeout(() => {
          setShowProcessing(false);
          setAccountNumber('');
          setSelectedPlan(null);
          navigation.goBack();
        }, 2000);
      } else {
        setPaymentStatus('failed');
        setTimeout(() => {
          setShowProcessing(false);
          Alert.alert('Subscription Failed', response.data.message || 'Failed to subscribe.');
        }, 2000);
      }
    } catch (error: any) {
      console.error('Subscription error:', error);
      
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
          Alert.alert('Error', error.response?.data?.message || 'Failed to subscribe.');
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
    setSelectedPlan(null);
    setAccountNumber('');
    setLoading(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { backgroundColor: tokens.colors.primary.main, paddingTop: 50 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <AppText variant="h2" weight="bold" color="#FFFFFF">
          Internet Subscription
        </AppText>
      </View>

      <BannerCarousel section="internet" />

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
            label="Account Number"
            placeholder="123456789"
            value={accountNumber}
            onChangeText={(text) => {
              setAccountNumber(text);
              if (errors.accountNumber) setErrors({ accountNumber: '' });
            }}
            keyboardType="number-pad"
            maxLength={15}
            error={errors.accountNumber}
            leftIcon={<Ionicons name="person" size={20} color={tokens.colors.text.secondary} />}
          />
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Plan
          </AppText>
          {loading ? (
            <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
                Loading plans...
              </AppText>
            </View>
          ) : internetPlans.length === 0 ? (
            <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
              <Ionicons name="information-circle-outline" size={48} color={tokens.colors.text.secondary} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
                No plans available for this provider
              </AppText>
            </View>
          ) : (
            internetPlans.map((plan) => (
              <Pressable
                key={plan.id}
                style={[
                  styles.planCard,
                  {
                    backgroundColor: tokens.colors.background.paper,
                    borderWidth: 2,
                    borderColor: selectedPlan?.id === plan.id
                      ? tokens.colors.primary.main
                      : tokens.colors.border.default,
                    borderRadius: tokens.radius.lg,
                    padding: tokens.spacing.md,
                    marginBottom: tokens.spacing.sm,
                    ...tokens.shadows.sm,
                  }
                ]}
                onPress={() => setSelectedPlan(plan)}
              >
                <View style={styles.planContent}>
                  <View style={{ flex: 1 }}>
                    <AppText variant="h3" weight="bold">
                      {plan.name}
                    </AppText>
                    <AppText variant="caption" color={tokens.colors.text.secondary}>
                      Valid for {plan.validity}
                    </AppText>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <AppText variant="h3" weight="bold" color={tokens.colors.primary.main}>
                      ₦{plan.price.toLocaleString()}
                    </AppText>
                    {selectedPlan?.id === plan.id && (
                      <Ionicons name="checkmark-circle" size={20} color={tokens.colors.primary.main} style={{ marginTop: 4 }} />
                    )}
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </View>

      </ScrollView>

      <PaymentPreviewSheet
        visible={showPaymentPreview}
        onClose={() => setShowPaymentPreview(false)}
        onConfirm={confirmSubscription}
        amount={selectedPlan?.price || 0}
        serviceType="internet"
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} - ${selectedPlan?.name || ''}`}
        recipient={accountNumber}
        balance={walletBalance}
        onAddFunds={handleAddFunds}
        onCleanup={handleCleanup}
      />

      <PaymentProcessingScreen
        visible={showProcessing}
        status={paymentStatus}
        amount={selectedPlan?.price || 0}
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} Subscription`}
        recipient={accountNumber}
        reference={transactionReference}
        onClose={handleProcessingClose}
        onRetry={handleRetry}
        walletBalanceBefore={walletBalance}
        walletBalanceAfter={walletBalance - (selectedPlan?.price || 0)}
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
  planCard: {
    marginBottom: 8,
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
