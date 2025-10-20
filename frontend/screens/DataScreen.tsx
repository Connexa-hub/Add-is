import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { AppText, AppInput, AppButton } from '../src/components/atoms';
import { PaymentPreviewSheet } from '../src/components/molecules';
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

interface DataPlan {
  id: string;
  name: string;
  price: number;
  validity: string;
  network: string;
}

export default function DataScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('mtn');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [dataPlans, setDataPlans] = useState<DataPlan[]>([]);
  const [errors, setErrors] = useState({ phoneNumber: '' });
  const [showPaymentPreview, setShowPaymentPreview] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);

  const networks = [
    { id: 'mtn', name: 'MTN', color: '#FFCC00', icon: 'phone-portrait' },
    { id: 'glo', name: 'GLO', color: '#00B050', icon: 'phone-portrait' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000', icon: 'phone-portrait' },
    { id: '9mobile', name: '9mobile', color: '#006F3F', icon: 'phone-portrait' },
  ];

  useEffect(() => {
    fetchWalletBalance();
  }, []);

  useEffect(() => {
    fetchDataPlans();
  }, [selectedNetwork]);

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

  const fetchDataPlans = async () => {
    setLoading(true);
    try {
      const networkName = selectedNetwork === '9mobile' ? '9mobile' : selectedNetwork.toUpperCase();
      
      const response = await axios.get(
        `${API_BASE_URL}/api/vtu/products?category=data&network=${networkName}`
      );

      if (response.data.success && response.data.data.products) {
        const plans = response.data.data.products.map((product: any) => ({
          id: product.variationCode,
          name: product.displayName || product.title,
          price: product.sellingPrice || product.faceValue,
          validity: product.validity || '30 days',
          network: selectedNetwork,
        }));
        setDataPlans(plans);
      }
    } catch (error) {
      console.error('Failed to fetch data plans:', error);
      Alert.alert('Error', 'Failed to load data plans. Please try again.');
    } finally {
      setLoading(false);
    }
    setSelectedPlan(null);
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{11}$/;
    return phoneRegex.test(phone);
  };

  const handlePurchase = () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setErrors({ phoneNumber: 'Please enter a valid 11-digit phone number' });
      return;
    }

    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a data plan');
      return;
    }

    setShowPaymentPreview(true);
  };

  const confirmPurchase = async (usedCashback: number) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/services/buy-data`,
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

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: tokens.spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Promotional Banner Carousel */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          style={{ marginBottom: tokens.spacing.lg }}
        >
          <View style={[styles.promoBanner, { backgroundColor: '#00B894', marginRight: 12 }]}>
            <View style={{ flex: 1 }}>
              <AppText variant="h3" weight="bold" color="#FFFFFF" style={{ marginBottom: 4 }}>
                OUT OF AIRTIME?
              </AppText>
              <AppText variant="caption" color="#FFFFFF">
                Top up anytime, anywhere and enjoy up to 6% cashback
              </AppText>
            </View>
          </View>
          <View style={[styles.promoBanner, { backgroundColor: '#2196F3' }]}>
            <View style={{ flex: 1 }}>
              <AppText variant="h3" weight="bold" color="#FFFFFF" style={{ marginBottom: 4 }}>
                Simply Dial
              </AppText>
              <AppText variant="caption" color="#FFFFFF">
                *955*4* mobile no#
              </AppText>
            </View>
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Network
          </AppText>
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
              </Pressable>
            ))}
          </View>
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
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

        {/* Promo Info Banner */}
        <View style={{ paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.md }}>
          <View style={[styles.infoCard, { backgroundColor: '#00B894', borderRadius: tokens.radius.lg, padding: tokens.spacing.md }]}>
            <AppText variant="body2" weight="semibold" color="#FFFFFF">
              Top-up your Data anytime, anywhere
            </AppText>
            <AppText variant="h3" weight="bold" color="#FFFFFF">
              Simply Dial *955*4* mobile no#
            </AppText>
          </View>
        </View>

        <View style={{ paddingHorizontal: tokens.spacing.lg, marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Data Plans
          </AppText>
          
          {/* Tabs for plan categories */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: tokens.spacing.md }}>
            <View style={{ flexDirection: 'row', gap: tokens.spacing.sm }}>
              <Pressable style={[styles.tabBtn, { backgroundColor: tokens.colors.primary.main, borderBottomWidth: 3, borderBottomColor: tokens.colors.primary.main }]}>
                <AppText variant="body2" weight="bold" color="#FFFFFF">HOT</AppText>
              </Pressable>
              <Pressable style={styles.tabBtn}>
                <AppText variant="body2" weight="semibold" color={tokens.colors.text.secondary}>Daily</AppText>
              </Pressable>
              <Pressable style={styles.tabBtn}>
                <AppText variant="body2" weight="semibold" color={tokens.colors.text.secondary}>Weekly</AppText>
              </Pressable>
              <Pressable style={styles.tabBtn}>
                <AppText variant="body2" weight="semibold" color={tokens.colors.text.secondary}>Monthly</AppText>
              </Pressable>
              <Pressable style={styles.tabBtn}>
                <AppText variant="body2" weight="semibold" color={tokens.colors.text.secondary}>Always-On</AppText>
              </Pressable>
            </View>
          </ScrollView>

          {dataPlans.map((plan) => (
            <Pressable
              key={plan.id}
              style={[
                styles.planCard,
                {
                  backgroundColor: selectedPlan?.id === plan.id ? '#E8F5E9' : tokens.colors.background.paper,
                  borderWidth: 1,
                  borderColor: selectedPlan?.id === plan.id
                    ? tokens.colors.success.main
                    : tokens.colors.border.default,
                  borderRadius: tokens.radius.lg,
                  padding: tokens.spacing.md,
                  marginBottom: tokens.spacing.sm,
                }
              ]}
              onPress={() => setSelectedPlan(plan)}
            >
              {/* Cashback badge */}
              {plan.price > 1000 && (
                <View style={{ position: 'absolute', top: -8, left: 12, backgroundColor: '#00B894', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <AppText variant="caption" weight="bold" color="#FFFFFF">
                    ₦{(plan.price * 0.02).toFixed(0)} Cashback
                  </AppText>
                </View>
              )}
              <View style={{ marginBottom: tokens.spacing.xs }}>
                <AppText variant="h3" weight="bold">
                  {plan.name}
                </AppText>
                <AppText variant="caption" color={tokens.colors.text.secondary}>
                  {plan.name}, valid for {plan.validity}
                </AppText>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: tokens.spacing.xs }}>
                <View>
                  <AppText variant="caption" color={tokens.colors.text.secondary}>Price</AppText>
                  <AppText variant="h3" weight="bold">₦{plan.price.toLocaleString()}</AppText>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <AppText variant="caption" color={tokens.colors.text.secondary}>Validity</AppText>
                  <AppText variant="body2" weight="semibold">{plan.validity}</AppText>
                </View>
              </View>
            </Pressable>
          ))}
        </View>

        {selectedPlan && (
          <View
            style={{
              backgroundColor: tokens.colors.primary.light,
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.lg,
              marginBottom: tokens.spacing.lg,
            }}
          >
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.xs }}>
              Summary
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Network: {networks.find(n => n.id === selectedNetwork)?.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Plan: {selectedPlan.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Phone: {phoneNumber || 'Not entered'}
            </AppText>
            <AppText variant="h3" weight="bold" color={tokens.colors.primary.main} style={{ marginTop: tokens.spacing.xs }}>
              Total: ₦{selectedPlan.price}
            </AppText>
          </View>
        )}

        <AppButton
          onPress={handlePurchase}
          loading={loading}
          disabled={loading || !selectedPlan || !phoneNumber}
          fullWidth
          size="lg"
        >
          Purchase Data
        </AppButton>
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