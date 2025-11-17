import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppText, AppInput, AppButton, SkeletonLoader, SkeletonList } from '../src/components/atoms';
import { PaymentPreviewSheet, BannerCarousel } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';
import { ScreenContentDisplay } from '../src/components/molecules';

interface DataPlan {
  id: string;
  name: string;
  price: number;
  validity: string;
  network: string;
  dataAmount?: string;
}

interface Network {
  id: string;
  name: string;
  serviceID: string;
  color: string;
  icon: string;
}

type TabType = 'hot' | 'daily' | 'weekly' | 'monthly';

const NETWORK_COLORS: { [key: string]: string } = {
  'mtn': '#FFCC00',
  'glo': '#00B050',
  'airtel': '#FF0000',
  '9mobile': '#006F3F',
  'default': '#6B7280'
};

export default function DataScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingNetworks, setLoadingNetworks] = useState(true);
  const [networks, setNetworks] = useState<Network[]>([]);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [filteredPlans, setFilteredPlans] = useState<DataPlan[]>([]);
  const [selectedTab, setSelectedTab] = useState<TabType>('hot');
  const [errors, setErrors] = useState({ phoneNumber: '' });
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    fetchWalletBalance();
    fetchNetworks();
  }, []);

  useEffect(() => {
    fetchDataPlans();
  }, [selectedNetwork]);

  useEffect(() => {
    filterPlansByTab();
  }, [selectedTab, dataPlans]);

  useEffect(() => {
    if (phoneNumber && validatePhoneNumber(phoneNumber) && selectedNetwork && selectedPlan && !showPaymentPreview) {
      handlePurchase();
    }
  }, [phoneNumber, selectedNetwork, selectedPlan]);

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

  const fetchNetworks = async () => {
    setLoadingNetworks(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/providers/data`
      );

      if (response.data.success && response.data.data.providers) {
        const networkList: Network[] = response.data.data.providers.map((provider: any) => {
          const networkId = provider.id || provider.serviceID?.toLowerCase();
          return {
            id: networkId,
            name: provider.name,
            serviceID: provider.serviceID,
            color: NETWORK_COLORS[networkId] || NETWORK_COLORS.default,
            icon: 'phone-portrait'
          };
        });

        setNetworks(networkList);

        if (networkList.length > 0 && !selectedNetwork) {
          setSelectedNetwork(networkList[0].id);
        }
      } else {
        Alert.alert('Error', 'No data networks available at the moment. Please try again later.');
      }
    } catch (error) {
      console.error('Failed to fetch networks:', error);
      Alert.alert('Error', 'Failed to load networks. Please check your connection and try again.');
    } finally {
      setLoadingNetworks(false);
    }
  };

  const fetchDataPlans = async () => {
    if (!selectedNetwork) {
      setDataPlans([]);
      setFilteredPlans([]);
      return;
    }

    setLoading(true);
    try {
      // Get the selected network's serviceID
      const network = networks.find(n => n.id === selectedNetwork);
      if (!network) {
        console.log('Network not found:', selectedNetwork);
        setDataPlans([]);
        setFilteredPlans([]);
        setLoading(false);
        return;
      }

      console.log('Fetching data plans for network:', network.name, 'serviceID:', network.serviceID);

      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/products?category=data&network=${network.name}`
      );

      console.log('Data plans response:', response.data);

      if (response.data.success && response.data.data.products) {
        // Filter products to only show those matching the selected network
        const networkProducts = response.data.data.products.filter((product: any) => {
          const productNetwork = product.network?.toLowerCase();
          const selectedNet = network.name.toLowerCase();
          return productNetwork === selectedNet || 
                 productNetwork?.includes(selectedNet) ||
                 product.serviceID === network.serviceID;
        });

        const plans = networkProducts.map((product: any) => ({
          id: product.variationCode,
          name: product.displayName || product.title,
          price: product.sellingPrice || product.faceValue,
          validity: product.validity || '30 days',
          network: selectedNetwork,
          dataAmount: extractDataAmount(product.displayName || product.title),
        }));

        console.log('Loaded data plans:', plans.length, 'for network:', network.name);
        setDataPlans(plans);
      } else {
        console.log('No products in response for network:', network.name);
        setDataPlans([]);
      }
    } catch (error) {
      console.error('Failed to fetch data plans:', error);
      Alert.alert('Error', 'Failed to load data plans. Please try again.');
      setDataPlans([]);
    } finally {
      setLoading(false);
    }
    setSelectedPlan(null);
  };

  const extractDataAmount = (name: string): string => {
    const match = name.match(/(\d+(?:\.\d+)?)\s*(GB|MB)/i);
    return match ? `${match[1]}${match[2]}` : '';
  };

  const filterPlansByTab = () => {
    let filtered = [...dataPlans];

    switch (selectedTab) {
      case 'hot':
        filtered = dataPlans.filter(plan => 
          plan.price >= 1000 && plan.price <= 5000
        ).slice(0, 10);
        break;
      case 'daily':
        filtered = dataPlans.filter(plan => 
          plan.validity.toLowerCase().includes('day') || 
          plan.validity.toLowerCase().includes('1 day') ||
          plan.validity.toLowerCase().includes('24')
        );
        break;
      case 'weekly':
        filtered = dataPlans.filter(plan => 
          plan.validity.toLowerCase().includes('week') || 
          plan.validity.toLowerCase().includes('7 days')
        );
        break;
      case 'monthly':
        filtered = dataPlans.filter(plan => 
          plan.validity.toLowerCase().includes('month') || 
          plan.validity.toLowerCase().includes('30 days') ||
          plan.validity.toLowerCase().includes('30days')
        );
        break;
      default:
        filtered = dataPlans;
    }

    setFilteredPlans(filtered);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{11}$/;
    return phoneRegex.test(phone);
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

    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a data plan');
      hasError = true;
    }

    setErrors(newErrors);
    if (hasError) return;

    try {
      setLoading(true);

      // Check if user has PIN setup
      const token = await AsyncStorage.getItem('token');
      const pinStatusResponse = await axios.get(
        `${API_BASE_URL}/pin/status`,
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
    } catch (error: any) {
      Alert.alert('Error', 'An error occurred while verifying your PIN status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const confirmPurchase = async (usedCashback: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/services/buy-data`,
        {
          phoneNumber,
          plan: selectedPlan!.id,
          network: selectedNetwork,
          amount: selectedPlan!.price,
          usedCashback
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setShowPaymentPreview(false);
      Alert.alert(
        'Success',
        `Data purchase successful! ${selectedPlan!.name} has been sent to ${phoneNumber}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
      await fetchWalletBalance();
    } catch (error: any) {
      setShowPaymentPreview(false);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to purchase data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = () => {
    setShowPaymentPreview(false);
    navigation.navigate('WalletFunding' as never);
  };

  const handleCleanup = () => {
    setSelectedPlan(null);
    setLoading(false);
  };

  const tabs: Array<{id: TabType, label: string}> = [
    { id: 'hot', label: 'HOT DEALS' },
    { id: 'daily', label: 'Daily' },
    { id: 'weekly', label: 'Weekly' },
    { id: 'monthly', label: 'Monthly' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
      <View style={[styles.header, { backgroundColor: tokens.colors.primary.main, paddingTop: 50 }]}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <AppText variant="h2" weight="bold" color="#FFFFFF">
          Buy Data
        </AppText>
      </View>

      <BannerCarousel section="data" />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: tokens.spacing.xl }} showsVerticalScrollIndicator={false}>
        <ScreenContentDisplay 
          screenName="data" 
          contentType="tip"
          onNavigate={(screen) => navigation.navigate(screen)}
        />

        <View style={{ paddingHorizontal: tokens.spacing.lg, marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Network
          </AppText>
          {loadingNetworks ? (
            <View style={styles.networkGrid}>
              {[...Array(4)].map((_, i) => (
                <View key={i} style={[styles.networkCard, { backgroundColor: tokens.colors.background.paper, borderRadius: tokens.radius.lg }]}>
                  <SkeletonLoader width={48} height={48} borderRadius={24} style={{ marginBottom: 8 }} />
                  <SkeletonLoader width="80%" height={14} />
                </View>
              ))}
            </View>
          ) : networks.length === 0 ? (
            <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
              <Ionicons name="alert-circle-outline" size={48} color={tokens.colors.text.secondary} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
                No networks available
              </AppText>
            </View>
          ) : (
            <View style={styles.networkGrid}>
              {networks.map((network) => (
                <Pressable
                  key={network.id}
                  style={[
                    styles.networkCard,
                    {
                      backgroundColor: tokens.colors.background.paper,
                      borderWidth: 2,
                      borderColor: selectedNetwork === network.id
                        ? tokens.colors.primary.main
                        : tokens.colors.border.default,
                      borderRadius: tokens.radius.lg,
                      ...tokens.shadows.sm,
                    }
                  ]}
                  onPress={() => setSelectedNetwork(network.id)}
                >
                  <View style={[styles.networkIcon, { backgroundColor: network.color }]}>
                    <Ionicons name={network.icon as any} size={24} color="#FFFFFF" />
                  </View>
                  <AppText variant="body2" weight="semibold" style={{ marginTop: tokens.spacing.xs }}>
                    {network.name}
                  </AppText>
                  {selectedNetwork === network.id && (
                    <View style={{ marginTop: 4 }}>
                      <Ionicons name="checkmark-circle" size={16} color={tokens.colors.primary.main} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

        <View style={{ paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
          <AppInput
            label="Phone Number"
            placeholder="08012345678"
            value={phoneNumber}
            onChangeText={(text) => {
              setPhoneNumber(text);
              if (errors.phoneNumber) setErrors({ phoneNumber: '' });
            }}
            keyboardType="phone-pad"
            maxLength={11}
            error={errors.phoneNumber}
            leftIcon={<Ionicons name="call" size={20} color={tokens.colors.text.secondary} />}
          />
        </View>

        <View style={{ paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Data Plans
          </AppText>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: tokens.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
              {tabs.map((tab) => (
                <Pressable 
                  key={tab.id}
                  style={[
                    styles.tabBtn, 
                    selectedTab === tab.id && { 
                      backgroundColor: tokens.colors.primary.main, 
                      borderBottomWidth: 3, 
                      borderBottomColor: tokens.colors.primary.main 
                    }
                  ]}
                  onPress={() => setSelectedTab(tab.id)}
                >
                  <AppText 
                    variant="body2" 
                    weight={selectedTab === tab.id ? "bold" : "semibold"} 
                    color={selectedTab === tab.id ? "#FFFFFF" : tokens.colors.text.secondary}
                  >
                    {tab.label}
                  </AppText>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          {loading ? (
            <View style={styles.plansGrid}>
              <SkeletonList count={4} />
            </View>
          ) : filteredPlans.length === 0 ? (
            <View style={{ paddingVertical: tokens.spacing.xl, alignItems: 'center' }}>
              <Ionicons name="information-circle-outline" size={48} color={tokens.colors.text.secondary} />
              <AppText variant="body2" color={tokens.colors.text.secondary} style={{ marginTop: tokens.spacing.md }}>
                No plans available for this category
              </AppText>
            </View>
          ) : (
            <View style={styles.plansGrid}>
              {filteredPlans.map((plan) => (
                <Pressable
                  key={plan.id}
                  style={[
                    styles.planGridCard,
                    {
                      backgroundColor: selectedPlan?.id === plan.id ? tokens.colors.primary.light : tokens.colors.background.paper,
                      borderWidth: 2,
                      borderColor: selectedPlan?.id === plan.id
                        ? tokens.colors.primary.main
                        : tokens.colors.border.default,
                      borderRadius: tokens.radius.lg,
                      padding: tokens.spacing.md,
                      marginBottom: tokens.spacing.sm,
                    }
                  ]}
                  onPress={() => setSelectedPlan(plan)}
                >
                  {plan.price > 1000 && selectedTab === 'hot' && (
                    <View style={{ position: 'absolute', top: -8, left: 8, backgroundColor: '#FF6B35', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, zIndex: 1 }}>
                      <AppText variant="caption" weight="bold" color="#FFFFFF">
                        🔥 HOT
                      </AppText>
                    </View>
                  )}

                  <View style={{ marginBottom: tokens.spacing.xs }}>
                    {plan.dataAmount && (
                      <AppText variant="h2" weight="bold" color={tokens.colors.primary.main}>
                        {plan.dataAmount}
                      </AppText>
                    )}
                    <AppText variant="body2" color={tokens.colors.text.secondary} numberOfLines={2}>
                      {plan.name}
                    </AppText>
                  </View>

                  <View style={{ marginTop: tokens.spacing.sm }}>
                    <AppText variant="caption" color={tokens.colors.text.secondary}>Price</AppText>
                    <AppText variant="h3" weight="bold">₦{plan.price.toLocaleString()}</AppText>
                  </View>

                  <View style={{ marginTop: tokens.spacing.xs }}>
                    <AppText variant="caption" color={tokens.colors.text.secondary}>Validity</AppText>
                    <AppText variant="body2" weight="semibold">{plan.validity}</AppText>
                  </View>

                  {selectedPlan?.id === plan.id && (
                    <View style={{ marginTop: tokens.spacing.sm, alignItems: 'center' }}>
                      <Ionicons name="checkmark-circle" size={24} color={tokens.colors.primary.main} />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      <PaymentPreviewSheet
        visible={showPaymentPreview}
        onClose={() => setShowPaymentPreview(false)}
        onConfirm={confirmPurchase}
        amount={selectedPlan?.price || 0}
        serviceType="data"
        serviceName={`${networks.find(n => n.id === selectedNetwork)?.name || ''} - ${selectedPlan?.name || ''}`}
        recipient={phoneNumber}
        balance={walletBalance}
        onAddFunds={handleAddFunds}
        onCleanup={handleCleanup}
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
  promoBanner: {
    width: 320,
    height: 140,
    borderRadius: 12,
    padding: 16,
    marginLeft: 16,
    justifyContent: 'center',
  },
  infoCard: {
    padding: 12,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  networkGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  networkCard: {
    width: '48%',
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  networkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plansGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  planGridCard: {
    width: '48%',
    marginBottom: 12,
    position: 'relative',
  },
  planCard: {
    marginBottom: 8,
    position: 'relative',
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});