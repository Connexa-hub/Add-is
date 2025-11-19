import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton } from '../atoms';
import NetworkErrorCard from './NetworkErrorCard';
import BottomSheet from './BottomSheet';
import { useAppTheme } from '../../hooks/useAppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants/api';
import { useBiometric } from '../../../hooks/useBiometric';
import { useNetwork } from '../../../contexts/NetworkContext';

export interface PaymentPreviewSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (usedCashback: number, biometricSuccess?: boolean) => void;
  amount: number;
  serviceType: string;
  serviceName: string;
  recipient?: string;
  balance: number;
  onAddFunds: () => void;
  onCleanup?: () => void;
}

export const PaymentPreviewSheet: React.FC<PaymentPreviewSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  amount,
  serviceType,
  serviceName,
  recipient,
  balance,
  onAddFunds,
  onCleanup,
}) => {
  const { tokens } = useAppTheme();
  const { isOnline } = useNetwork();
  const { capabilities, authenticate, isBiometricEnabled } = useBiometric();
  const [availableCashback, setAvailableCashback] = useState(0);
  const [useCashback, setUseCashback] = useState(true);
  const [cashbackToEarn, setCashbackToEarn] = useState(0);
  const [loading, setLoading] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [networkError, setNetworkError] = useState({ visible: false, message: '', type: 'network_error' as const });
  const [previousVisible, setPreviousVisible] = useState(visible);

  useEffect(() => {
    if (visible) {
      fetchCashbackData();
      checkBiometric();
    }
  }, [visible, amount]);

  useEffect(() => {
    if (previousVisible && !visible) {
      // Always cleanup when modal closes
      if (onCleanup) {
        onCleanup();
      }
      // Reset internal states
      setUseCashback(true);
      setLoading(false);
      setNetworkError({ visible: false, message: '', type: 'network_error' });
    }
    setPreviousVisible(visible);
  }, [visible, onCleanup]);

  const fetchCashbackData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');

      // Get available cashback balance
      const cashbackResponse = await axios.get(
        `${API_BASE_URL}/api/admin/cashback/user/history`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (cashbackResponse.data.success) {
        const totalCashback = cashbackResponse.data.data
          .filter((t: any) => t.cashbackAmount > 0)
          .reduce((sum: number, t: any) => sum + t.cashbackAmount, 0);
        setAvailableCashback(totalCashback);
      }

      // Calculate cashback to earn (assume 2% for now)
      const earnedCashback = amount * 0.02;
      setCashbackToEarn(parseFloat(earnedCashback.toFixed(2)));
    } catch (error) {
      console.error('Failed to fetch cashback:', error);
    }
  };

  const checkBiometric = async () => {
    const enabled = await isBiometricEnabled();
    setBiometricEnabled(enabled && capabilities.isAvailable);
  };

  const isNetworkError = (error: any) => {
    if (error.code === 'ECONNABORTED' || error.message === 'canceled') {
      return { isNetwork: true, type: 'timeout' as const };
    }
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      return { isNetwork: true, type: 'network_error' as const };
    }
    if (!error.response && error.request) {
      return { isNetwork: true, type: 'network_error' as const };
    }
    if (error.response && error.response.status >= 500) {
      return { isNetwork: true, type: 'server_error' as const };
    }
    return { isNetwork: false, type: undefined };
  };

  const showNetworkError = (errorType: 'network_error' | 'timeout' | 'server_error' = 'network_error', customMessage: string = '') => {
    setNetworkError({
      visible: true,
      message: customMessage,
      type: errorType,
    });
  };

  const handleRetryPayment = async () => {
    setNetworkError({ visible: false, message: '', type: 'network_error' });
    await handleConfirm();
  };

  const handleDismissError = () => {
    setNetworkError({ visible: false, message: '', type: 'network_error' });
  };

  const finalAmount = useCashback && availableCashback > 0
    ? Math.max(0, amount - Math.min(availableCashback, amount))
    : amount;

  const cashbackUsed = useCashback ? Math.min(availableCashback, amount) : 0;
  const insufficientFunds = balance < finalAmount;

  const handleConfirm = async () => {
    if (insufficientFunds) {
      return;
    }

    // Check network connectivity before proceeding
    if (!isOnline) {
      showNetworkError('network_error', 'You are currently offline. Please check your internet connection and try again.');
      return;
    }

    setLoading(true);

    // Check if PIN is set up before allowing payment
    try {
      const token = await AsyncStorage.getItem('token');
      const pinStatusResponse = await axios.get(
        `${API_BASE_URL}/api/pin/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setLoading(false);

      if (pinStatusResponse.data.success && !pinStatusResponse.data.data.isPinSet) {
        onClose(); // Close payment preview

        // Alert user to set up PIN
        Alert.alert(
          'Set Up Transaction PIN',
          'For security, you need to set up a Transaction PIN before making purchases.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Set Up PIN',
              onPress: () => {
                // Trigger PIN setup callback
                if (onCleanup) onCleanup();
              }
            }
          ]
        );
        return;
      }

      // If biometric is enabled, show biometric modal OVERLAYING the payment preview
      if (biometricEnabled) {
        const authResult = await authenticate(
          'Authenticate to confirm payment',
          'Cancel'
        );

        if (authResult.success) {
          // Biometric success - close preview and proceed directly to payment processing (skip PIN)
          onClose();
          onConfirm(cashbackUsed, true); // Pass true to indicate biometric was successful
        } else {
          // Biometric cancelled - fallback to PIN input
          onClose();
          onConfirm(cashbackUsed, false); // Pass false to indicate biometric failed
        }
      } else {
        // No biometric - close preview and proceed with PIN verification
        onClose();
        onConfirm(cashbackUsed, false); // Pass false to indicate no biometric
      }
    } catch (error) {
      setLoading(false);
      console.error('Failed to check PIN status:', error);

      // Check if it's a network error
      const networkErrorCheck = isNetworkError(error);
      if (networkErrorCheck.isNetwork) {
        showNetworkError(networkErrorCheck.type);
        return;
      }

      Alert.alert('Error', 'Failed to verify security settings. Please try again.');
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Payment Preview"
      height="50%"
      scrollable={false}
    >
      <View style={styles.compactContainer}>
        {/* Balance and Service Info - Compact Row */}
        <View style={[styles.infoCard, {
          backgroundColor: insufficientFunds ? tokens.colors.error.light : tokens.colors.primary.light,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.sm,
          marginBottom: tokens.spacing.sm,
        }]}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <AppText variant="caption" color={tokens.colors.text.secondary}>Balance</AppText>
              <AppText variant="h3" weight="bold" color={insufficientFunds ? tokens.colors.error.main : tokens.colors.primary.main}>
                ₦{balance.toLocaleString()}
              </AppText>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <AppText variant="caption" color={tokens.colors.text.secondary}>After Payment</AppText>
              <AppText variant="h3" weight="bold" color={balance - finalAmount >= 0 ? tokens.colors.success.main : tokens.colors.error.main}>
                ₦{Math.max(0, balance - finalAmount).toLocaleString()}
              </AppText>
            </View>
          </View>
        </View>

        {/* Service Details - Compact */}
        <View style={[styles.detailsCard, {
          backgroundColor: tokens.colors.background.paper,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.sm,
          marginBottom: tokens.spacing.sm,
        }]}>
          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>Service</AppText>
            <AppText variant="body2" weight="semibold">{serviceName}</AppText>
          </View>
          {recipient && (
            <View style={styles.detailRow}>
              <AppText variant="body2" color={tokens.colors.text.secondary}>Recipient</AppText>
              <AppText variant="body2" weight="semibold">{recipient}</AppText>
            </View>
          )}
          <View style={styles.detailRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>Amount</AppText>
            <AppText variant="body2" weight="semibold">₦{amount.toLocaleString()}</AppText>
          </View>
        </View>

        {/* Cashback Section - Only if available */}
        {availableCashback > 0 && (
          <TouchableOpacity
            style={[styles.cashbackCard, {
              backgroundColor: useCashback ? tokens.colors.success.light : tokens.colors.background.paper,
              borderRadius: tokens.radius.md,
              padding: tokens.spacing.sm,
              marginBottom: tokens.spacing.sm,
              borderWidth: 1,
              borderColor: useCashback ? tokens.colors.success.main : tokens.colors.border.default,
            }]}
            onPress={() => setUseCashback(!useCashback)}
          >
            <View style={styles.row}>
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons
                  name={useCashback ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={useCashback ? tokens.colors.success.main : tokens.colors.text.secondary}
                />
                <AppText variant="body2" weight="semibold" style={{ marginLeft: tokens.spacing.xs }}>
                  Use Cashback
                </AppText>
              </View>
              <AppText variant="subtitle1" weight="bold" color={tokens.colors.success.main}>
                ₦{availableCashback.toLocaleString()}
              </AppText>
            </View>
          </TouchableOpacity>
        )}

        {/* Payment Summary - Compact */}
        <View style={[styles.summaryCard, {
          backgroundColor: tokens.colors.background.paper,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.sm,
          marginBottom: tokens.spacing.sm,
        }]}>
          <View style={styles.summaryRow}>
            <AppText variant="body2" color={tokens.colors.text.secondary}>Subtotal</AppText>
            <AppText variant="body2">₦{amount.toLocaleString()}</AppText>
          </View>
          {useCashback && cashbackUsed > 0 && (
            <View style={styles.summaryRow}>
              <AppText variant="body2" color={tokens.colors.success.main}>Cashback</AppText>
              <AppText variant="body2" color={tokens.colors.success.main}>-₦{cashbackUsed.toLocaleString()}</AppText>
            </View>
          )}
          <View style={styles.summaryRow}>
            <AppText variant="caption" color={tokens.colors.text.secondary}>
              <Ionicons name="gift" size={12} color={tokens.colors.warning.main} /> Earn Cashback
            </AppText>
            <AppText variant="caption" color={tokens.colors.warning.main}>+₦{cashbackToEarn.toLocaleString()}</AppText>
          </View>
          <View style={[styles.summaryRow, { 
            marginTop: tokens.spacing.xs, 
            paddingTop: tokens.spacing.xs, 
            borderTopWidth: 1, 
            borderTopColor: tokens.colors.border.default 
          }]}>
            <AppText variant="subtitle1" weight="bold">Total</AppText>
            <AppText variant="h3" weight="bold" color={tokens.colors.primary.main}>₦{finalAmount.toLocaleString()}</AppText>
          </View>
        </View>

        {/* Insufficient Funds Warning */}
        {insufficientFunds && (
          <View style={[styles.warningCard, {
            backgroundColor: tokens.colors.error.light,
            borderRadius: tokens.radius.md,
            padding: tokens.spacing.sm,
            marginBottom: tokens.spacing.sm,
          }]}>
            <AppText variant="caption" color={tokens.colors.error.main} weight="semibold">
              ⚠️ Insufficient Balance - Need ₦{(finalAmount - balance).toLocaleString()} more
            </AppText>
          </View>
        )}

        {/* Action Button */}
        {insufficientFunds ? (
          <AppButton
            onPress={onAddFunds}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="add-circle" size={20} color="#FFFFFF" />}
          >
            Add Funds to Wallet
          </AppButton>
        ) : (
          <AppButton
            onPress={handleConfirm}
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            disabled={loading}
          >
            Pay
          </AppButton>
        )}
      </View>

      {/* Network Error Card */}
      <NetworkErrorCard
        visible={networkError.visible}
        message={networkError.message}
        errorType={networkError.type}
        onRetry={handleRetryPayment}
        onDismiss={handleDismissError}
        position="bottom"
      />
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  compactContainer: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoCard: {
    // Dynamic styles applied inline
  },
  detailsCard: {
    // Dynamic styles applied inline
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cashbackCard: {
    // Dynamic styles applied inline
  },
  summaryCard: {
    // Dynamic styles applied inline
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  warningCard: {
    // Dynamic styles applied inline
  },
});

export default PaymentPreviewSheet;