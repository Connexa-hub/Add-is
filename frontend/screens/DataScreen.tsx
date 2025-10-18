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

  const networks = [
    { id: 'mtn', name: 'MTN', color: '#FFCC00', icon: 'phone-portrait' },
    { id: 'glo', name: 'GLO', color: '#00B050', icon: 'phone-portrait' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000', icon: 'phone-portrait' },
    { id: '9mobile', name: '9mobile', color: '#006F3F', icon: 'phone-portrait' },
  ];

  const samplePlans: DataPlan[] = [
    { id: 'mtn-500mb', name: '500MB', price: 150, validity: '30 days', network: 'mtn' },
    { id: 'mtn-1gb', name: '1GB', price: 300, validity: '30 days', network: 'mtn' },
    { id: 'mtn-2gb', name: '2GB', price: 600, validity: '30 days', network: 'mtn' },
    { id: 'mtn-5gb', name: '5GB', price: 1500, validity: '30 days', network: 'mtn' },
    { id: 'mtn-10gb', name: '10GB', price: 3000, validity: '30 days', network: 'mtn' },
  ];

  useEffect(() => {
    setDataPlans(samplePlans.filter(plan => plan.network === selectedNetwork));
    setSelectedPlan(null);
  }, [selectedNetwork]);

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^[0-9]{11}$/;
    return phoneRegex.test(phone);
  };

  const handlePurchase = async () => {
    if (!validatePhoneNumber(phoneNumber)) {
      setErrors({ phoneNumber: 'Please enter a valid 11-digit phone number' });
      return;
    }

    if (!selectedPlan) {
      Alert.alert('Error', 'Please select a data plan');
      return;
    }

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/services/buy-data`,
        {
          phoneNumber,
          plan: selectedPlan.id,
          network: selectedNetwork,
          amount: selectedPlan.price
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success',
        `Data purchase successful! ${selectedPlan.name} has been sent to ${phoneNumber}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to purchase data. Please try again.'
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
          Buy Data
        </AppText>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.lg }}>
        <View style={{ marginBottom: tokens.spacing.xl }}>
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

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Data Plan
          </AppText>
          {dataPlans.map((plan) => (
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
                <AppText variant="h3" weight="bold" color={tokens.colors.primary.main}>
                  ₦{plan.price}
                </AppText>
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
          {loading ? 'Processing...' : 'Purchase Data'}
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
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedPlanCard: {
    borderColor: '#007AFF',
    borderWidth: 2,
    backgroundColor: '#E3F2FD',
  },
  pressedPlanCard: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  pressedButton: {
    opacity: 0.8,
  },
});