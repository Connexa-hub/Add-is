import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import AppText from './AppText';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface AppBadgeProps {
  children: string | number;
  variant?: BadgeVariant;
  size?: BadgeSize;
  rounded?: boolean;
}

export const AppBadge: React.FC<AppBadgeProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = false,
}) => {
  const { tokens } = useAppTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: tokens.colors.primary.light, text: tokens.colors.primary.dark };
      case 'success':
        return { bg: tokens.colors.success.light, text: tokens.colors.success.dark };
      case 'warning':
        return { bg: tokens.colors.warning.light, text: tokens.colors.warning.dark };
      case 'error':
        return { bg: tokens.colors.error.light, text: tokens.colors.error.dark };
      case 'info':
        return { bg: tokens.colors.info.light, text: tokens.colors.info.dark };
      case 'neutral':
        return { bg: tokens.colors.neutral.gray200, text: tokens.colors.text.primary };
      default:
        return { bg: tokens.colors.primary.light, text: tokens.colors.primary.dark };
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: tokens.spacing.xs / 2, paddingHorizontal: tokens.spacing.sm };
      case 'md':
        return { paddingVertical: tokens.spacing.xs, paddingHorizontal: tokens.spacing.md };
      case 'lg':
        return { paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.base };
      default:
        return { paddingVertical: tokens.spacing.xs, paddingHorizontal: tokens.spacing.md };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'sm':
        return tokens.typography.fontSize.xs;
      case 'md':
        return tokens.typography.fontSize.sm;
      case 'lg':
        return tokens.typography.fontSize.base;
      default:
        return tokens.typography.fontSize.sm;
    }
  };

  const colors = getVariantColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.bg,
          borderRadius: rounded ? tokens.radius.full : tokens.radius.sm,
          ...getPadding(),
        },
      ]}
    >
      <AppText
        variant="caption"
        weight="semibold"
        style={{ color: colors.text, fontSize: getFontSize() }}
      >
        {children}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppBadge;
