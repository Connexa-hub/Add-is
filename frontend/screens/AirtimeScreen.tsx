
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
import { useAppTheme } from '../src/hooks/useAppTheme';
import { API_BASE_URL } from '../constants/api';

const NETWORK_PREFIXES = {
  mtn: ['0703', '0706', '0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0913', '0916'],
  glo: ['0705', '0805', '0807', '0811', '0815', '0905', '0915'],
  airtel: ['0701', '0708', '0802', '0808', '0812', '0901', '0902', '0904', '0907', '0912'],
  '9mobile': ['0809', '0817', '0818', '0909', '0908']
};

export default function AirtimeScreen() {
  const navigation = useNavigation();
  const { tokens } = useAppTheme();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phoneNumber: '', amount: '' });

  const networks = [
    { id: 'mtn', name: 'MTN', color: '#FFCC00', textColor: '#000000', icon: 'phone-portrait' },
    { id: 'glo', name: 'GLO', color: '#00B050', textColor: '#FFFFFF', icon: 'phone-portrait' },
    { id: 'airtel', name: 'Airtel', color: '#FF0000', textColor: '#FFFFFF', icon: 'phone-portrait' },
    { id: '9mobile', name: '9mobile', color: '#006F3F', textColor: '#FFFFFF', icon: 'phone-portrait' },
  ];

  const quickAmounts = [
    { value: '100', label: '₦100' },
    { value: '200', label: '₦200' },
    { value: '500', label: '₦500' },
    { value: '1000', label: '₦1,000' },
    { value: '2000', label: '₦2,000' },
    { value: '5000', label: '₦5,000' },
  ];

  useEffect(() => {
    if (phoneNumber.length >= 4) {
      detectNetwork(phoneNumber);
    } else {
      setSelectedNetwork('');
    }
  }, [phoneNumber]);

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

    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('token');
      const serviceID = selectedNetwork === '9mobile' ? 'etisalat' : selectedNetwork;
      
      const response = await axios.post(
        `${API_BASE_URL}/services/buy-airtime`,
        {
          phoneNumber,
          network: serviceID,
          amount: parseFloat(amount)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert(
        'Success',
        `Airtime purchase successful! ₦${amount} has been sent to ${phoneNumber}`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to purchase airtime. Please try again.'
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
          Buy Airtime
        </AppText>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: tokens.spacing.lg }}>
        <View style={{ marginBottom: tokens.spacing.xl }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Select Network
          </AppText>
          <View style={styles.networkRow}>
            {networks.map((network) => (
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
              ✓ {networks.find(n => n.id === selectedNetwork)?.name} Detected
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
          />
        </View>

        <View style={{ marginBottom: tokens.spacing.lg }}>
          <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.md }}>
            Quick Amount
          </AppText>
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
        </View>

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

        {amount && phoneNumber && selectedNetwork && (
          <View
            style={{
              backgroundColor: tokens.colors.primary.light,
              padding: tokens.spacing.md,
              borderRadius: tokens.radius.lg,
              marginBottom: tokens.spacing.lg,
            }}
          >
            <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.xs }}>
              Purchase Summary
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Network: {networks.find(n => n.id === selectedNetwork)?.name}
            </AppText>
            <AppText variant="body2" color={tokens.colors.text.secondary}>
              Phone Number: {phoneNumber}
            </AppText>
            <AppText variant="h3" weight="bold" color={tokens.colors.primary.main} style={{ marginTop: tokens.spacing.xs }}>
              Total: ₦{amount}
            </AppText>
          </View>
        )}

        <AppButton
          onPress={handlePurchase}
          loading={loading}
          disabled={loading || !selectedNetwork || !amount || !phoneNumber}
          fullWidth
          size="lg"
        >
          {loading ? 'Processing...' : 'Purchase Airtime'}
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
});
