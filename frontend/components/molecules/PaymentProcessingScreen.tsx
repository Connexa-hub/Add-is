
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Modal, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';

export type PaymentStatus = 'processing' | 'success' | 'pending' | 'failed';

export interface PaymentProcessingScreenProps {
  visible: boolean;
  status: PaymentStatus;
  amount: number;
  serviceName: string;
  recipient?: string;
  reference?: string;
  onClose: () => void;
  onRetry?: () => void;
}

export const PaymentProcessingScreen: React.FC<PaymentProcessingScreenProps> = ({
  visible,
  status,
  amount,
  serviceName,
  recipient,
  reference,
  onClose,
  onRetry,
}) => {
  const { tokens } = useAppTheme();
  const [spinValue] = useState(new Animated.Value(0));
  const [scaleValue] = useState(new Animated.Value(0));
  const [pulseValue] = useState(new Animated.Value(1));

  useEffect(() => {
    if (status === 'processing') {
      // Spinning animation for processing
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Pulsing animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (status === 'success' || status === 'failed') {
      // Success/Failed pop animation
      Animated.spring(scaleValue, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  }, [status]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusConfig = () => {
    switch (status) {
      case 'processing':
        return {
          icon: 'hourglass-outline',
          title: 'Processing Payment',
          message: 'Please wait while we process your transaction...',
          color: tokens.colors.primary.main,
          showActions: false,
        };
      case 'success':
        return {
          icon: 'checkmark-circle',
          title: 'Payment Successful!',
          message: 'Your transaction has been completed successfully.',
          color: tokens.colors.success.main,
          showActions: true,
        };
      case 'pending':
        return {
          icon: 'time-outline',
          title: 'Payment Pending',
          message: 'Due to network issues, your payment is being verified. You will be notified once confirmed.',
          color: tokens.colors.warning.main,
          showActions: true,
        };
      case 'failed':
        return {
          icon: 'close-circle',
          title: 'Payment Failed',
          message: 'Something went wrong. Please try again.',
          color: tokens.colors.error.main,
          showActions: true,
        };
      default:
        return {
          icon: 'hourglass-outline',
          title: 'Processing',
          message: '',
          color: tokens.colors.primary.main,
          showActions: false,
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={status !== 'processing' ? onClose : undefined}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.content,
            {
              backgroundColor: tokens.colors.background.paper,
              borderRadius: tokens.radius.xl,
              padding: tokens.spacing.xl,
            },
          ]}
        >
          {/* Icon */}
          <View style={styles.iconContainer}>
            {status === 'processing' ? (
              <Animated.View
                style={{
                  transform: [{ rotate: spin }, { scale: pulseValue }],
                }}
              >
                <Ionicons name={config.icon as any} size={80} color={config.color} />
              </Animated.View>
            ) : (
              <Animated.View
                style={{
                  transform: [{ scale: scaleValue }],
                }}
              >
                <Ionicons name={config.icon as any} size={80} color={config.color} />
              </Animated.View>
            )}
          </View>

          {/* Title */}
          <AppText
            variant="h2"
            weight="bold"
            align="center"
            style={{ marginTop: tokens.spacing.lg, marginBottom: tokens.spacing.sm }}
          >
            {config.title}
          </AppText>

          {/* Message */}
          <AppText
            variant="body2"
            color={tokens.colors.text.secondary}
            align="center"
            style={{ marginBottom: tokens.spacing.lg }}
          >
            {config.message}
          </AppText>

          {/* Transaction Details */}
          <View
            style={[
              styles.detailsCard,
              {
                backgroundColor: tokens.colors.background.default,
                borderRadius: tokens.radius.lg,
                padding: tokens.spacing.base,
                marginBottom: tokens.spacing.lg,
              },
            ]}
          >
            <View style={styles.detailRow}>
              <AppText variant="caption" color={tokens.colors.text.secondary}>
                Service
              </AppText>
              <AppText variant="body2" weight="semibold">
                {serviceName}
              </AppText>
            </View>
            {recipient && (
              <View style={styles.detailRow}>
                <AppText variant="caption" color={tokens.colors.text.secondary}>
                  Recipient
                </AppText>
                <AppText variant="body2" weight="semibold">
                  {recipient}
                </AppText>
              </View>
            )}
            <View style={styles.detailRow}>
              <AppText variant="caption" color={tokens.colors.text.secondary}>
                Amount
              </AppText>
              <AppText variant="h3" weight="bold" color={config.color}>
                ₦{amount.toLocaleString()}
              </AppText>
            </View>
            {reference && (
              <View style={styles.detailRow}>
                <AppText variant="caption" color={tokens.colors.text.secondary}>
                  Reference
                </AppText>
                <AppText variant="caption" weight="medium">
                  {reference}
                </AppText>
              </View>
            )}
          </View>

          {/* Status-specific message */}
          {status === 'pending' && (
            <View
              style={[
                styles.alertBox,
                {
                  backgroundColor: tokens.colors.warning.light,
                  borderRadius: tokens.radius.base,
                  padding: tokens.spacing.md,
                  marginBottom: tokens.spacing.base,
                },
              ]}
            >
              <AppText variant="caption" color={tokens.colors.warning.main} align="center">
                ℹ️ Check your transaction history later to confirm the status
              </AppText>
            </View>
          )}

          {/* Actions */}
          {config.showActions && (
            <View style={styles.actions}>
              {status === 'failed' && onRetry && (
                <AppButton
                  onPress={onRetry}
                  variant="primary"
                  size="lg"
                  fullWidth
                  style={{ marginBottom: tokens.spacing.sm }}
                  icon={<Ionicons name="refresh" size={20} color="#FFFFFF" />}
                >
                  Try Again
                </AppButton>
              )}
              <AppButton
                onPress={onClose}
                variant={status === 'failed' ? 'ghost' : 'primary'}
                size="lg"
                fullWidth
              >
                {status === 'success' ? 'Done' : 'Close'}
              </AppButton>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    width: '100%',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertBox: {
    width: '100%',
  },
  actions: {
    width: '100%',
  },
});

export default PaymentProcessingScreen;
