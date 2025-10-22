
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

interface TVProvider {
  id: string;
  name: string;
  color: string;
  icon: string;
}

interface TVPackage {
  id: string;
  name: string;
  price: number;
  validity: string;
  provider: string;
}

const PROVIDER_COLORS: { [key: string]: string } = {
  'dstv': '#0033A0',
  'gotv': '#FF0000',
  'startimes': '#FFD700',
  'showmax': '#FF1744',
  default: '#6B7280'
};

export default function TVScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [smartcardNumber, setSmartcardNumber] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [selectedPackage, setSelectedPackage] = useState<TVPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providers, setProviders] = useState<TVProvider[]>([]);
  const [tvPackages, setTvPackages] = useState<TVPackage[]>([]);
  const [errors, setErrors] = useState({ smartcardNumber: '' });
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
      fetchTVPackages();
    }
  }, [selectedProvider]);

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
        `${API_BASE_URL}/api/vtu/products?category=tv-subscription`
      );

      if (response.data.success && response.data.data.products) {
        const uniqueProviders = new Map<string, TVProvider>();
        
        response.data.data.products.forEach((product: any) => {
          const providerId = product.serviceID || product.network?.toLowerCase();
          if (providerId && !uniqueProviders.has(providerId)) {
            uniqueProviders.set(providerId, {
              id: providerId,
              name: product.network || formatProviderName(providerId),
              color: PROVIDER_COLORS[providerId] || PROVIDER_COLORS.default,
              icon: 'tv',
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
      Alert.alert(
        'Error',
        'Failed to load TV providers. Please check your connection and try again.',
        [{ text: 'Retry', onPress: fetchProviders }]
      );
      setProviders([]);
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

  const fetchTVPackages = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/products?category=tv-subscription&serviceID=${selectedProvider}`
      );

      if (response.data.success && response.data.data.products) {
        const packages = response.data.data.products.map((product: any) => ({
          id: product.variationCode,
          name: product.displayName || product.title,
          price: product.sellingPrice || product.faceValue,
          validity: product.validity || '30 days',
          provider: selectedProvider,
        }));
        setTvPackages(packages);
      }
    } catch (error) {
      console.error('Failed to fetch TV packages:', error);
      Alert.alert('Error', 'Failed to load TV packages. Please try again.');
    } finally {
      setLoading(false);
    }
    setSelectedPackage(null);
  };

  const validateSmartcardNumber = (number: string) => {
    const smartcardRegex = /^[0-9]{10,11}$/;
    return smartcardRegex.test(number);
  };

  const handleSubscribe = () => {
    if (!validateSmartcardNumber(smartcardNumber)) {
      setErrors({ smartcardNumber: 'Please enter a valid 10-11 digit smartcard number' });
      return;
    }

    if (!selectedPackage) {
      Alert.alert('Error', 'Please select a TV package');
      return;
    }

    setShowPaymentPreview(true);
  };

  const confirmSubscription = async (usedCashback: number) => {
    setShowPaymentPreview(false);
    setShowProcessing(true);
    setPaymentStatus('processing');

    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/services/subscribe-tv`,
        {
          smartcardNumber,
          variation_code: selectedPackage!.id,
          serviceID: selectedProvider,
          amount: selectedPackage!.price,
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
      console.error('Subscription error:', error);
      
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
          TV Subscription
        </AppText>
      </View>

      <BannerCarousel section="tv" />

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
            label="Smartcard Number"
            placeholder="1234567890"
            value={smartcardNumber}
            onChangeText={(text) => {
              setSmartcardNumber(text);
              if (errors.smartcardNumber) setErrors({ smartcardNumber: '' });
            }}
            keyboardType="number-pad"
            maxLength={11}
            error={errors.smartcardNumber}
            leftIcon={<Ionicons name="card" size={20} color={tokens.colors.text.secondary} />}
          />
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Package
          </AppText>
          {loading ? (
            <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={tokens.colors.primary.main} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
                Loading packages...
              </AppText>
            </View>
          ) : tvPackages.length === 0 ? (
            <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
              <Ionicons name="information-circle-outline" size={48} color={tokens.colors.text.secondary} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md, textAlign: 'center' }}>
                No packages available for this provider.{'\n'}Please select a different provider.
              </AppText>
            </View>
          ) : (
            <ScrollView 
              style={{ maxHeight: 400 }} 
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              {tvPackages.map((pkg) => (
                <Pressable
                  key={pkg.id}
                  style={[
                    styles.packageCard,
                    {
                      backgroundColor: tokens.colors.background.paper,
                      borderWidth: 2,
                      borderColor: selectedPackage?.id === pkg.id
                        ? tokens.colors.primary.main
                        : tokens.colors.border.default,
                      borderRadius: tokens.radius.lg,
                      padding: tokens.spacing.md,
                      marginBottom: tokens.spacing.sm,
                      ...tokens.shadows.sm,
                    }
                  ]}
                  onPress={() => setSelectedPackage(pkg)}
                >
                  <View style={styles.packageContent}>
                    <View style={{ flex: 1 }}>
                      <AppText variant="subtitle2" weight="bold">
                        {pkg.name}
                      </AppText>
                      <AppText variant="caption" color={tokens.colors.text.secondary} style={{ marginTop: 2 }}>
                        Valid for {pkg.validity}
                      </AppText>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <AppText variant="h3" weight="bold" color={tokens.colors.primary.main}>
                        ₦{pkg.price.toLocaleString()}
                      </AppText>
                      {selectedPackage?.id === pkg.id && (
                        <Ionicons name="checkmark-circle" size={20} color={tokens.colors.primary.main} style={{ marginTop: 4 }} />
                      )}
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        {selectedPackage && smartcardNumber && (
          <View
            style={{
              backgroundColor: tokens.colors.primary.light,
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.lg,
              marginBottom: tokens.spacing.lg,
            }}
          >
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.xs }}>
              Subscription Summary
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Provider: {providers.find(p => p.id === selectedProvider)?.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Package: {selectedPackage.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Smartcard: {smartcardNumber}
            </AppText>
            <AppText variant="h3" weight="bold" color={tokens.colors.primary.main} style={{ marginTop: tokens.spacing.xs }}>
              Total: ₦{selectedPackage.price.toLocaleString()}
            </AppText>
          </View>
        )}

        <AppButton
          onPress={handleSubscribe}
          loading={loading}
          disabled={loading || loadingProviders || !selectedPackage || !smartcardNumber}
          fullWidth
          size="lg"
        >
          Continue to Payment
        </AppButton>
      </ScrollView>

      <PaymentPreviewSheet
        visible={showPaymentPreview}
        onClose={() => setShowPaymentPreview(false)}
        onConfirm={confirmSubscription}
        amount={selectedPackage?.price || 0}
        serviceType="tv"
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} - ${selectedPackage?.name || ''}`}
        recipient={smartcardNumber}
        balance={walletBalance}
        onAddFunds={handleAddFunds}
      />

      <PaymentProcessingScreen
        visible={showProcessing}
        status={paymentStatus}
        amount={selectedPackage?.price || 0}
        serviceName={`${providers.find(p => p.id === selectedProvider)?.name || ''} Subscription`}
        recipient={smartcardNumber}
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
  packageCard: {
    marginBottom: 8,
  },
  packageContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
