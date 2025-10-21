import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText, AppBadge } from '../atoms';

export interface ServiceCardProps {
  title: string;
  icon: React.ReactNode;
  description?: string;
  badge?: string;
  onPress: () => void;
  backgroundColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  icon,
  description,
  badge,
  onPress,
  backgroundColor,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { tokens } = useAppTheme();

  const bgColor = backgroundColor || tokens.colors.background.elevated;

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: bgColor,
          borderRadius: tokens.radius.md,
          padding: tokens.spacing.base,
          borderWidth: 1,
          borderColor: tokens.colors.border.light,
          ...tokens.shadows.sm,
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint || `Tap to access ${title}`}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: tokens.colors.primary.light,
              borderRadius: tokens.radius.md,
              padding: tokens.spacing.md,
            },
          ]}
        >
          {icon}
        </View>
        {badge && (
          <AppBadge variant="success" size="sm">
            {badge}
          </AppBadge>
        )}
      </View>
      <View style={{ marginTop: tokens.spacing.md }}>
        <AppText variant="subtitle1" weight="semibold" style={{ marginBottom: tokens.spacing.xs }}>
          {title}
        </AppText>
        {description && (
          <AppText variant="caption" color={tokens.colors.text.secondary}>
            {description}
          </AppText>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ServiceCard;
