import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText, AppButton } from '../atoms';

export interface BalanceCardProps {
  balance: string | number;
  currency?: string;
  label?: string;
  showAddFunds?: boolean;
  onAddFunds?: () => void;
  backgroundColor?: string;
  accessibilityLabel?: string;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({
  balance,
  currency = '₦',
  label = 'Wallet Balance',
  showAddFunds = true,
  onAddFunds,
  backgroundColor,
  accessibilityLabel,
}) => {
  const { tokens } = useAppTheme();

  const bgColor = backgroundColor || tokens.colors.primary.main;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.lg,
          ...tokens.shadows.md,
        },
      ]}
      accessibilityLabel={accessibilityLabel || `${label}: ${currency}${balance}`}
    >
      <AppText variant="subtitle2" style={{ color: tokens.colors.text.inverse, marginBottom: tokens.spacing.xs }}>
        {label}
      </AppText>
      <View style={styles.balanceRow}>
        <AppText variant="h1" weight="bold" style={{ color: tokens.colors.text.inverse }}>
          {currency}{typeof balance === 'number' ? balance.toLocaleString() : balance}
        </AppText>
      </View>
      {showAddFunds && onAddFunds && (
        <View style={{ marginTop: tokens.spacing.base }}>
          <AppButton
            onPress={onAddFunds}
            variant="outline"
            size="sm"
            accessibilityLabel="Add funds to wallet"
          >
            + Add Funds
          </AppButton>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
});

export default BalanceCard;
