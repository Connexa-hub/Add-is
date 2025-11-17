
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton, AppDivider } from '../atoms';
import NetworkErrorCard from './NetworkErrorCard';
import { useAppTheme } from '../../hooks/useAppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL } from '../../../constants/api';
import { useBiometric } from '../../../hooks/useBiometric';
import { useNetwork } from '../../../contexts/NetworkContext';

export interface PaymentPreviewSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (usedCashback: number) => void;
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

      // Close payment preview and proceed with authentication
      onClose();

      // If biometric is enabled, try biometric first
      if (biometricEnabled) {
        const authResult = await authenticate(
          'Confirm Payment',
          'Cancel'
        );

        if (authResult.success) {
          // Biometric success - proceed with payment
          onConfirm(cashbackUsed);
        } else {
          // Biometric failed or cancelled - user can choose to use PIN instead
          // The navigation to PINVerify will be handled by the parent screen
        }
      } else {
        // No biometric - proceed with PIN verification
        onConfirm(cashbackUsed);
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: tokens.colors.background.paper,
              borderTopLeftRadius: tokens.radius.xl,
              borderTopRightRadius: tokens.radius.xl,
              height: '50%',
            },
          ]}
        >
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View
              style={[
                styles.handle,
                { backgroundColor: tokens.colors.border.default },
              ]}
            />
          </View>

          <ScrollView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <AppText variant="h3" weight="bold">
                Payment Preview
              </AppText>
              <TouchableOpacity onPress={onClose}>
                <Ionicons name="close" size={24} color={tokens.colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Balance Section - Prominent Display */}
            <View
              style={[
                styles.balanceCard,
                {
                  backgroundColor: insufficientFunds ? tokens.colors.error.light : tokens.colors.primary.light,
                  borderRadius: tokens.radius.lg,
                  padding: tokens.spacing.lg,
                  marginBottom: tokens.spacing.base,
                  borderWidth: 2,
                  borderColor: insufficientFunds ? tokens.colors.error.main : tokens.colors.primary.main,
                },
              ]}
            >
              <View style={{ marginBottom: tokens.spacing.md }}>
                <AppText variant="caption" color={tokens.colors.text.secondary}>
                  Current Wallet Balance
                </AppText>
                <AppText variant="h1" weight="bold" color={insufficientFunds ? tokens.colors.error.main : tokens.colors.primary.main}>
                  ₦{balance.toLocaleString()}
                </AppText>
              </View>
              
              <View style={styles.balanceBreakdown}>
                <View style={styles.balanceRow}>
                  <AppText variant="body2" color={tokens.colors.text.secondary}>
                    Payment Amount
                  </AppText>
                  <AppText variant="body1" weight="semibold">
                    -₦{finalAmount.toLocaleString()}
                  </AppText>
                </View>
                
                <View style={[styles.balanceRow, { marginTop: tokens.spacing.xs, paddingTop: tokens.spacing.xs, borderTopWidth: 1, borderTopColor: tokens.colors.border.default }]}>
                  <AppText variant="subtitle2" weight="semibold">
                    Balance After Payment
                  </AppText>
                  <AppText 
                    variant="h3" 
                    weight="bold" 
                    color={balance - finalAmount >= 0 ? tokens.colors.success.main : tokens.colors.error.main}
                  >
                    ₦{Math.max(0, balance - finalAmount).toLocaleString()}
                  </AppText>
                </View>
              </View>
            </View>

            {/* Service Details */}
            <View style={styles.section}>
              <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
                Service Details
              </AppText>
              <View style={styles.detailRow}>
                <AppText variant="body2" color={tokens.colors.text.secondary}>
                  Service
                </AppText>
                <AppText variant="body2" weight="semibold">
                  {serviceName}
                </AppText>
              </View>
              {recipient && (
                <View style={styles.detailRow}>
                  <AppText variant="body2" color={tokens.colors.text.secondary}>
                    Recipient
                  </AppText>
                  <AppText variant="body2" weight="semibold">
                    {recipient}
                  </AppText>
                </View>
              )}
              <View style={styles.detailRow}>
                <AppText variant="body2" color={tokens.colors.text.secondary}>
                  Amount
                </AppText>
                <AppText variant="body2" weight="semibold">
                  ₦{amount.toLocaleString()}
                </AppText>
              </View>
            </View>

            <AppDivider />

            {/* Cashback Section */}
            {availableCashback > 0 && (
              <>
                <TouchableOpacity
                  style={[styles.cashbackCard, {
                    backgroundColor: useCashback ? tokens.colors.success.light : tokens.colors.background.default,
                    borderRadius: tokens.radius.lg,
                    padding: tokens.spacing.base,
                    borderWidth: 1,
                    borderColor: useCashback ? tokens.colors.success.main : tokens.colors.border.default,
                  }]}
                  onPress={() => setUseCashback(!useCashback)}
                >
                  <View style={styles.cashbackHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons
                        name={useCashback ? 'checkbox' : 'square-outline'}
                        size={24}
                        color={useCashback ? tokens.colors.success.main : tokens.colors.text.secondary}
                      />
                      <AppText variant="subtitle2" weight="semibold" style={{ marginLeft: tokens.spacing.sm }}>
                        Use Available Cashback
                      </AppText>
                    </View>
                    <AppText variant="h3" weight="bold" color={tokens.colors.success.main}>
                      ₦{availableCashback.toLocaleString()}
                    </AppText>
                  </View>
                  {useCashback && (
                    <View style={{ marginTop: tokens.spacing.sm }}>
                      <AppText variant="caption" color={tokens.colors.success.main}>
                        ✓ Cashback of ₦{cashbackUsed.toLocaleString()} will be applied
                      </AppText>
                    </View>
                  )}
                </TouchableOpacity>
                <AppDivider />
              </>
            )}

            {/* Cashback to Earn */}
            <View
              style={[
                styles.earnCard,
                {
                  backgroundColor: tokens.colors.warning.light,
                  borderRadius: tokens.radius.lg,
                  padding: tokens.spacing.base,
                },
              ]}
            >
              <View style={styles.earnRow}>
                <Ionicons name="gift" size={24} color={tokens.colors.warning.main} />
                <View style={{ marginLeft: tokens.spacing.sm, flex: 1 }}>
                  <AppText variant="body2" weight="semibold">
                    Cashback Reward
                  </AppText>
                  <AppText variant="caption" color={tokens.colors.text.secondary}>
                    You'll earn from this transaction
                  </AppText>
                </View>
                <AppText variant="h3" weight="bold" color={tokens.colors.warning.main}>
                  +₦{cashbackToEarn.toLocaleString()}
                </AppText>
              </View>
            </View>

            <AppDivider />

            {/* Payment Summary */}
            <View style={styles.section}>
              <AppText variant="subtitle2" weight="semibold" style={{ marginBottom: tokens.spacing.sm }}>
                Payment Summary
              </AppText>
              <View style={styles.summaryRow}>
                <AppText variant="body2" color={tokens.colors.text.secondary}>
                  Subtotal
                </AppText>
                <AppText variant="body2">₦{amount.toLocaleString()}</AppText>
              </View>
              {useCashback && cashbackUsed > 0 && (
                <View style={styles.summaryRow}>
                  <AppText variant="body2" color={tokens.colors.success.main}>
                    Cashback Applied
                  </AppText>
                  <AppText variant="body2" color={tokens.colors.success.main}>
                    -₦{cashbackUsed.toLocaleString()}
                  </AppText>
                </View>
              )}
              <View style={[styles.summaryRow, { marginTop: tokens.spacing.sm }]}>
                <AppText variant="h3" weight="bold">
                  Total
                </AppText>
                <AppText variant="h2" weight="bold" color={tokens.colors.primary.main}>
                  ₦{finalAmount.toLocaleString()}
                </AppText>
              </View>
            </View>

            {/* Insufficient Funds Warning */}
            {insufficientFunds && (
              <View
                style={[
                  styles.warningCard,
                  {
                    backgroundColor: tokens.colors.error.light,
                    borderRadius: tokens.radius.lg,
                    padding: tokens.spacing.base,
                    marginBottom: tokens.spacing.base,
                  },
                ]}
              >
                <AppText variant="body2" color={tokens.colors.error.main} weight="semibold">
                  ⚠️ Insufficient Balance
                </AppText>
                <AppText variant="caption" color={tokens.colors.error.main}>
                  You need ₦{(finalAmount - balance).toLocaleString()} more to complete this transaction
                </AppText>
              </View>
            )}

            {/* Action Buttons */}
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
          </ScrollView>

          {/* Network Error Card */}
          <NetworkErrorCard
            visible={networkError.visible}
            message={networkError.message}
            errorType={networkError.type}
            onRetry={handleRetryPayment}
            onDismiss={handleDismissError}
            position="bottom"
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    height: '50%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceCard: {
    marginBottom: 16,
  },
  balanceBreakdown: {
    marginTop: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  section: {
    marginVertical: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cashbackCard: {
    marginVertical: 16,
  },
  cashbackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earnCard: {
    marginVertical: 16,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningCard: {
    marginBottom: 16,
  },
});

export default PaymentPreviewSheet;
