import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import AppText from './AppText';

export type TagVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export interface AppTagProps {
  children: string;
  variant?: TagVariant;
  onPress?: () => void;
  onRemove?: () => void;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const AppTag: React.FC<AppTagProps> = ({
  children,
  variant = 'neutral',
  onPress,
  onRemove,
  leftIcon,
  rightIcon,
}) => {
  const { tokens } = useAppTheme();

  const getVariantColors = () => {
    switch (variant) {
      case 'primary':
        return { bg: tokens.colors.primary.light, text: tokens.colors.primary.dark, border: tokens.colors.primary.main };
      case 'success':
        return { bg: tokens.colors.success.light, text: tokens.colors.success.dark, border: tokens.colors.success.main };
      case 'warning':
        return { bg: tokens.colors.warning.light, text: tokens.colors.warning.dark, border: tokens.colors.warning.main };
      case 'error':
        return { bg: tokens.colors.error.light, text: tokens.colors.error.dark, border: tokens.colors.error.main };
      case 'neutral':
        return { bg: tokens.colors.neutral.gray100, text: tokens.colors.text.primary, border: tokens.colors.border.default };
      default:
        return { bg: tokens.colors.neutral.gray100, text: tokens.colors.text.primary, border: tokens.colors.border.default };
    }
  };

  const colors = getVariantColors();

  const content = (
    <View
      style={[
        styles.tag,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderRadius: tokens.radius.full,
          paddingVertical: tokens.spacing.xs,
          paddingHorizontal: tokens.spacing.md,
        },
      ]}
    >
      {leftIcon && <View style={{ marginRight: tokens.spacing.xs }}>{leftIcon}</View>}
      <AppText variant="caption" weight="medium" style={{ color: colors.text }}>
        {children}
      </AppText>
      {rightIcon && <View style={{ marginLeft: tokens.spacing.xs }}>{rightIcon}</View>}
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          style={{ marginLeft: tokens.spacing.xs }}
          accessibilityLabel="Remove tag"
          accessibilityRole="button"
        >
          <AppText variant="caption" weight="bold" style={{ color: colors.text }}>
            ✕
          </AppText>
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} accessibilityRole="button">
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
});

export default AppTag;
