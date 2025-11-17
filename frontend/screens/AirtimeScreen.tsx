import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppText, AppInput, AppButton, SkeletonLoader } from '../src/components/atoms';
import { PaymentPreviewSheet, BannerCarousel, ScreenContentDisplay, PaymentProcessingScreen } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

interface NetworkProvider {
  id: string;
  name: string;
  color: string;
  textColor: string;
  icon: string;
}

const NETWORK_PREFIXES = {
  mtn: ['0703', '0706', '0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'],
  glo: ['0705', '0805', '0807', '0811', '0815', '0905', '0915'],
  airtel: ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0912'],
  '9mobile': ['0809', '0817', '0818', '0909', '0908']
};

const NETWORK_COLORS: { [key: string]: { color: string; textColor: string } } = {
  'mtn': { color: '#FFCC00', textColor: '#000000' },
  'glo': { color: '#00B050', textColor: '#FFFFFF' },
  'airtel': { color: '#FF0000', textColor: '#FFFFFF' },
  '9mobile': { color: '#006F3F', textColor: '#FFFFFF' },
  'etisalat': { color: '#006F3F', textColor: '#FFFFFF' },
  default: { color: '#6B7280', textColor: '#FFFFFF' }
};

export default function AirtimeScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providers, setProviders] = useState<NetworkProvider[]>([]);
  const [errors, setErrors] = useState({ phoneNumber: '', amount: '' });
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [quickAmounts, setQuickAmounts] = useState<Array<{value: string; label: string}>>([]);
  const [loadingQuickAmounts, setLoadingQuickAmounts] = useState(true);
  const [gridLayout, setGridLayout] = useState({ columns: 3, rows: 2 });
  const [allowCustomInput, setAllowCustomInput] = useState(true);
  const [showProcessing, setShowProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'processing' | 'success' | 'pending' | 'failed'>('processing');
  const [transactionReference, setTransactionReference] = useState('');

  useEffect(() => {
    fetchWalletBalance();
    fetchProviders();
  }, []);

  useEffect(() => {
    if (selectedNetwork) {
      fetchQuickAmounts();
    }
  }, [selectedNetwork]);

  useEffect(() => {
    if (phoneNumber.length >= 4) {
      detectNetwork(phoneNumber);
    } else {
      setSelectedNetwork('');
    }
  }, [phoneNumber]);

  useEffect(() => {
    if (phoneNumber && validatePhoneNumber(phoneNumber) && selectedNetwork && amount && parseFloat(amount) >= 50 && !showPaymentPreview) {
      handlePurchase();
    }
  }, [phoneNumber, selectedNetwork, amount]);

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
        `${API_BASE_URL}/api/vtu/providers/airtime`
      );

      if (response.data.success && response.data.data.providers) {
        const networkList: NetworkProvider[] = response.data.data.providers.map((provider: any) => {
          const networkId = provider.id || provider.serviceID?.toLowerCase();
          const colorInfo = NETWORK_COLORS[networkId] || NETWORK_COLORS.default;
          return {
            id: networkId,
            name: provider.name,
            color: colorInfo.color,
            textColor: colorInfo.textColor,
            icon: 'phone-portrait'
          };
        });

        setProviders(networkList);

        if (networkList.length > 0 && !selectedNetwork) {
          setSelectedNetwork(networkList[0].id);
        }
      } else {
        Alert.alert('Error', 'No networks available at the moment. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to fetch providers:', error);
      Alert.alert('Error', 'Failed to load networks. Please check your connection and try again.');
    } finally {
      setLoadingProviders(false);
    }
  };

  const fetchQuickAmounts = async () => {
    if (!selectedNetwork) return;

    setLoadingQuickAmounts(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/quick-amounts/airtime/${selectedNetwork}`
      );

      if (response.data.success && response.data.data.amounts) {
        const amounts = response.data.data.amounts.map((amt: number) => ({
          value: amt.toString(),
          label: `₦${amt.toLocaleString()}`
        }));
        setQuickAmounts(amounts);

        // Set layout configuration
        if (response.data.data.layout) {
          setGridLayout(response.data.data.layout);
        }

        // Set custom input permission
        if (response.data.data.allowCustomInput !== undefined) {
          setAllowCustomInput(response.data.data.allowCustomInput);
        }
      } else {
        // Fallback to default amounts
        setQuickAmounts([
          { value: '100', label: '₦100' },
          { value: '200', label: '₦200' },
          { value: '500', label: '₦500' },
          { value: '1000', label: '₦1,000' },
          { value: '2000', label: '₦2,000' },
          { value: '5000', label: '₦5,000' },
        ]);
        setGridLayout({ columns: 3, rows: 2 });
        setAllowCustomInput(true);
      }
    } catch (error) {
      console.error('Failed to fetch quick amounts:', error);
      // Fallback to default amounts
      setQuickAmounts([
        { value: '100', label: '₦100' },
        { value: '200', label: '₦200' },
        { value: '500', label: '₦500' },
        { value: '1000', label: '₦1,000' },
        { value: '2000', label: '₦2,000' },
        { value: '5000', label: '₦5,000' },
      ]);
      setGridLayout({ columns: 3, rows: 2 });
      setAllowCustomInput(true);
    } finally {
      setLoadingQuickAmounts(false);
    }
  };

  const detectNetwork = (phone) => {
    const prefix = phone.substring(0, 4);
    for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
      if (prefixes.includes(prefix)) {
        setSelectedNetwork(network);
        return;
      }
    }
    setSelectedNetwork('');
  };

  const validatePhoneNumber = (phone) => {
    const phoneRegex = /^0[0-9]{10}$/;
    return phoneRegex.test(phone);
  };

  const validateAmount = (amt) => {
    const numAmount = parseFloat(amt);
    return numAmount >= 50 && numAmount <= 50000;
  };

  const handlePurchase = async () => {
    let hasError = false;
    const newErrors = { phoneNumber: '', amount: '' };

    if (!validatePhoneNumber(phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid 11-digit phone number';
      hasError = true;
    }

    if (!selectedNetwork) {
      newErrors.phoneNumber = 'Network not detected. Please check the number';
      hasError = true;
    }

    if (!validateAmount(amount)) {
      newErrors.amount = 'Amount must be between ₦50 and ₦50,000';
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

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
                    // After PIN setup, proceed with purchase
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
      setLoading(false);
      Alert.alert('Error', 'An error occurred while verifying your PIN status. Please try again.');
    }
  };

  const confirmPurchase = async (usedCashback: number) => {
    setShowPaymentPreview(false);

    navigation.navigate('PINVerify', {
      title: 'Confirm Purchase',
      message: `Enter your PIN to purchase ₦${amount} airtime`,
      onSuccess: async () => {
        setShowProcessing(true);
        setPaymentStatus('processing');

        try {
          const token = await AsyncStorage.getItem('token');
          const serviceID = selectedNetwork === '9mobile' ? 'etisalat' : selectedNetwork;

          const response = await axios.post(
            `${API_BASE_URL}/api/services/buy-airtime`,
            {
              phoneNumber,
              network: serviceID,
              amount: parseFloat(amount),
              usedCashback
            },
            { 
              headers: { Authorization: `Bearer ${token}` },
              timeout: 30000
            }
          );

          if (response.data.success) {
            setPaymentStatus('success');
            setTransactionReference(response.data.transaction?.reference || '');
            await fetchWalletBalance();

            setTimeout(() => {
              setShowProcessing(false);
              setPhoneNumber('');
              setAmount('');
              navigation.goBack();
            }, 2000);
          } else {
            setPaymentStatus('failed');
            setTimeout(() => {
              setShowProcessing(false);
              Alert.alert('Transaction Failed', response.data.message || 'Failed to purchase airtime.');
            }, 2000);
          }
        } catch (error: any) {
          console.error('Airtime purchase error:', error);
          
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
              Alert.alert('Error', error.response?.data?.message || 'Failed to purchase airtime.');
            }, 2000);
          }
        }
      }
    });
  };

  const handleAddFunds = () => {
    setShowPaymentPreview(false);
    navigation.navigate('WalletFunding' as never);
  };

  const handlePaymentCleanup = () => {
    setAmount('');
    setLoading(false);
  };

  const getNetworkIcon = () => {
    if (!selectedNetwork) return null;
    const network = providers.find(n => n.id === selectedNetwork);
    return network ? (
      <View style={[styles.networkIndicator, { backgroundColor: network.color }]}>
        <AppText variant="caption" weight="bold" color={network.textColor}>
          {network.name}
        </AppText>
      </View>
    ) : null;
  };

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { backgroundColor: tokens.colors.primary.main, paddingTop: 50 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <AppText variant="h2" weight="bold" color="#FFFFFF">
          Buy Airtime
        </AppText>
      </View>

      <BannerCarousel section="airtime" />

      <ScreenContentDisplay 
        screenName="airtime" 
        contentType="announcement"
        onNavigate={(screen) => navigation.navigate(screen)}
      />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.lg }}>
        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Network
          </AppText>
          <View style={styles.networkRow}>
            {providers.map((network) => (
              <Pressable
                key={network.id}
                style={[
                  styles.networkCard,
                  {
                    backgroundColor: network.color,
                    borderWidth: 3,
                    borderColor: selectedNetwork === network.id
                      ? tokens.colors.primary.main
                      : 'transparent',
                    borderRadius: tokens.radius.lg,
                    ...tokens.shadows.md,
                  }
                ]}
                onPress={() => setSelectedNetwork(network.id)}
              >
                <Ionicons name={network.icon} size={32} color={network.textColor} />
                <AppText 
                  variant="body2" 
                  weight="bold" 
                  color={network.textColor}
                  style={{ marginTop: tokens.spacing.xs }}
                >
                  {network.name}
                </AppText>
              </Pressable>
            ))}
          </View>
          {selectedNetwork && (
            <AppText 
              variant="caption" 
              color={tokens.colors.success.main} 
              style={{ marginTop: tokens.spacing.sm, textAlign: 'center' }}
            >
              ✓ {providers.find(n => n.id === selectedNetwork)?.name} Detected
            </AppText>
          )}
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppInput
            label="Phone Number"
            placeholder="08012345678"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: '' });
            }}
            keyboardType="phone-pad"
            maxLength={11}
            error={errors.phoneNumber}
            leftIcon={<Ionicons name="call" size={20} color={tokens.colors.text.secondary} />}
            rightIcon={getNetworkIcon()}
          />
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Quick Amount
          </AppText>
          {loadingQuickAmounts ? (
            <View style={[styles.quickAmountsGrid, { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }]}>
              {[...Array(6)].map((_, i) => (
                <View key={i} style={{ width: '31%', marginBottom: tokens.spacing.sm }}>
                  <SkeletonLoader height={48} borderRadius={tokens.radius.md} />
                </View>
              ))}
            </View>
          ) : (
            <View style={[styles.quickAmountsGrid, { 
              flexDirection: 'row', 
              flexWrap: 'wrap',
              justifyContent: 'space-between'
            }]}>
              {quickAmounts.map((item) => (
                <Pressable
                  key={item.value}
                  style={[
                    styles.quickAmountCard,
                    {
                      width: gridLayout.columns === 2 ? '48%' : gridLayout.columns === 4 ? '23%' : '31%',
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
                  onPress={() => setAmount(item.value)}
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

        {allowCustomInput && (
          <View style={{ marginBottom: tokens.spacing.lg }}>
            <AppInput
              label="Or Enter Custom Amount (₦)"
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
              Minimum: ₦50 | Maximum: ₦50,000
            </AppText>
          </View>
        )}

      </ScrollView>

      <PaymentPreviewSheet
        visible={showPaymentPreview}
        onClose={() => setShowPaymentPreview(false)}
        onConfirm={confirmPurchase}
        amount={parseFloat(amount || '0')}
        serviceType="airtime"
        serviceName={`${providers.find(n => n.id === selectedNetwork)?.name || ''} Airtime`}
        recipient={phoneNumber}
        balance={walletBalance}
        onAddFunds={handleAddFunds}
        onCleanup={handlePaymentCleanup}
      />

      <PaymentProcessingScreen
        visible={showProcessing}
        status={paymentStatus}
        amount={parseFloat(amount || '0')}
        serviceName={`${providers.find(n => n.id === selectedNetwork)?.name || ''} Airtime`}
        recipient={phoneNumber}
        reference={transactionReference}
        onClose={() => {
          setShowProcessing(false);
          if (paymentStatus === 'success' || paymentStatus === 'pending') {
            navigation.goBack();
          }
        }}
        onRetry={() => {
          setShowProcessing(false);
          setShowPaymentPreview(true);
        }}
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
  networkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  networkCard: {
    width: '23%',
    padding: 12,
    alignItems: 'center',
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
  networkIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
});