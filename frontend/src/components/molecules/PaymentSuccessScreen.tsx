
import React, { useState } from 'react';
import { View, StyleSheet, Modal, Pressable, ScrollView, Share, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText, AppButton } from '../atoms';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useNavigation } from '@react-navigation/native';

export interface BonusAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  buttonText: string;
  onPress: () => void;
}

export interface PaymentSuccessScreenProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  serviceName: string;
  recipient?: string;
  reference: string;
  cashbackEarned?: number;
  walletBalanceBefore?: number;
  walletBalanceAfter?: number;
  bonusActions?: BonusAction[];
}

export const PaymentSuccessScreen: React.FC<PaymentSuccessScreenProps> = ({
  visible,
  onClose,
  amount,
  serviceName,
  recipient,
  reference,
  cashbackEarned = 0,
  walletBalanceBefore,
  walletBalanceAfter,
  bonusActions = [],
}) => {
  const { tokens } = useAppTheme();
  const navigation = useNavigation();

  const handleViewDetails = () => {
    navigation.navigate('TransactionDetails', { reference });
    onClose();
  };

  const handleShareReceipt = () => {
    navigation.navigate('ShareReceipt', { 
      reference,
      amount,
      serviceName,
      recipient,
      cashbackEarned,
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: tokens.colors.background.default }]}>
        {/* Header with Done button */}
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onClose}>
            <AppText variant="h3" weight="semibold" color={tokens.colors.success.main}>
              Done
            </AppText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* Success Icon */}
          <View style={[styles.successIcon, { backgroundColor: tokens.colors.success.main }]}>
            <Ionicons name="checkmark" size={48} color="#FFFFFF" />
          </View>

          {/* Success Title */}
          <AppText variant="h2" weight="bold" align="center" style={{ marginTop: tokens.spacing.lg }}>
            Successful
          </AppText>

          {/* Amount */}
          <AppText variant="display" weight="bold" align="center" style={{ marginTop: tokens.spacing.sm }}>
            ₦{amount.toLocaleString()}
          </AppText>

          {/* Cashback Earned */}
          {cashbackEarned > 0 && (
            <Pressable 
              style={[styles.bonusCard, { backgroundColor: tokens.colors.warning.light, marginTop: tokens.spacing.lg }]}
              onPress={() => {}}
            >
              <AppText variant="body2" color={tokens.colors.text.secondary}>
                Bonus Earned
              </AppText>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="gift" size={20} color={tokens.colors.warning.main} style={{ marginRight: 4 }} />
                <AppText variant="h3" weight="bold" color={tokens.colors.warning.main}>
                  +₦{cashbackEarned.toFixed(2)} Cashback
                </AppText>
                <Ionicons name="chevron-forward" size={20} color={tokens.colors.text.secondary} style={{ marginLeft: 4 }} />
              </View>
            </Pressable>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <Pressable 
              style={[styles.actionButton, { backgroundColor: tokens.colors.background.paper }]}
              onPress={handleShareReceipt}
            >
              <Ionicons name="share-social" size={24} color={tokens.colors.success.main} />
              <AppText variant="body2" weight="medium" style={{ marginTop: 8 }}>
                Share Receipt
              </AppText>
            </Pressable>

            <Pressable 
              style={[styles.actionButton, { backgroundColor: tokens.colors.background.paper }]}
              onPress={handleViewDetails}
            >
              <Ionicons name="document-text" size={24} color={tokens.colors.success.main} />
              <AppText variant="body2" weight="medium" style={{ marginTop: 8 }}>
                View Details
              </AppText>
            </Pressable>
          </View>

          {/* Bonus Actions Section */}
          {bonusActions.length > 0 && (
            <View style={{ marginTop: tokens.spacing.xl }}>
              <AppText variant="h3" weight="bold" style={{ marginBottom: tokens.spacing.md }}>
                Special Bonus For You
              </AppText>

              {bonusActions.map((action) => (
                <View 
                  key={action.id}
                  style={[
                    styles.bonusActionCard,
                    { backgroundColor: tokens.colors.background.paper, marginBottom: tokens.spacing.sm }
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                    <View style={[styles.bonusIcon, { backgroundColor: tokens.colors.primary.light }]}>
                      <Ionicons name={action.icon as any} size={24} color={tokens.colors.primary.main} />
                    </View>
                    <View style={{ flex: 1, marginLeft: tokens.spacing.md }}>
                      <AppText variant="subtitle2" weight="semibold">
                        {action.title}
                      </AppText>
                      <AppText variant="caption" color={tokens.colors.text.secondary}>
                        {action.description}
                      </AppText>
                    </View>
                  </View>
                  <Pressable
                    style={[styles.bonusButton, { backgroundColor: tokens.colors.success.main }]}
                    onPress={action.onPress}
                  >
                    <AppText variant="body2" weight="bold" color="#FFFFFF">
                      {action.buttonText}
                    </AppText>
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  bonusCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 32,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  bonusActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bonusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default PaymentSuccessScreen;
