import React from 'react';
import { StyleSheet, TouchableOpacity, ActivityIndicator, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import AppText from './AppText';

export type AppButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
export type AppButtonSize = 'sm' | 'md' | 'lg';

export interface AppButtonProps {
  children: string;
  onPress: () => void;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const AppButton: React.FC<AppButtonProps> = ({
  children,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { tokens } = useAppTheme();

  const getBackgroundColor = () => {
    if (disabled) return tokens.colors.neutral.gray200;
    switch (variant) {
      case 'primary':
        return tokens.colors.primary.main;
      case 'secondary':
        return tokens.colors.success.main;
      case 'outline':
      case 'ghost':
        return 'transparent';
      default:
        return tokens.colors.primary.main;
    }
  };

  const getTextColor = () => {
    if (disabled) return tokens.colors.text.disabled;
    switch (variant) {
      case 'primary':
      case 'secondary':
        return tokens.colors.text.inverse;
      case 'outline':
        return tokens.colors.primary.main;
      case 'ghost':
        return tokens.colors.text.primary;
      default:
        return tokens.colors.text.inverse;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'sm':
        return { paddingVertical: tokens.spacing.sm, paddingHorizontal: tokens.spacing.base };
      case 'md':
        return { paddingVertical: tokens.spacing.md, paddingHorizontal: tokens.spacing.lg };
      case 'lg':
        return { paddingVertical: tokens.spacing.base, paddingHorizontal: tokens.spacing.xl };
      default:
        return { paddingVertical: tokens.spacing.md, paddingHorizontal: tokens.spacing.lg };
    }
  };

  const getBorderStyle = () => {
    if (variant === 'outline') {
      return {
        borderWidth: 2,
        borderColor: disabled ? tokens.colors.border.default : tokens.colors.primary.main,
      };
    }
    return {};
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || children}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderRadius: tokens.radius.base,
          ...getPadding(),
          ...getBorderStyle(),
          ...tokens.shadows.sm,
          width: fullWidth ? '100%' : 'auto',
        },
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={getTextColor()} size="small" />
        ) : (
          <>
            {icon && <View style={{ marginRight: tokens.spacing.sm }}>{icon}</View>}
            <AppText
              variant="button"
              style={{ color: getTextColor(), fontSize: tokens.typography.variants.button.fontSize }}
            >
              {children}
            </AppText>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AppButton;
