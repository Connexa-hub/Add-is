import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { AppText, AppDivider } from '../atoms';

export interface InfoRowProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onPress?: () => void;
  showDivider?: boolean;
  labelColor?: string;
  valueColor?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const InfoRow: React.FC<InfoRowProps> = ({
  label,
  value,
  icon,
  rightIcon,
  onPress,
  showDivider = true,
  labelColor,
  valueColor,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const { tokens } = useAppTheme();

  const content = (
    <>
      <View
        style={[
          styles.row,
          {
            paddingVertical: tokens.spacing.md,
          },
        ]}
      >
        {icon && <View style={{ marginRight: tokens.spacing.md }}>{icon}</View>}
        <View style={styles.content}>
          <AppText variant="body2" color={labelColor || tokens.colors.text.secondary}>
            {label}
          </AppText>
          <View style={styles.valueContainer}>
            <AppText variant="subtitle1" weight="semibold" color={valueColor || tokens.colors.text.primary}>
              {value}
            </AppText>
            {rightIcon && <View style={{ marginLeft: tokens.spacing.sm }}>{rightIcon}</View>}
          </View>
        </View>
      </View>
      {showDivider && <AppDivider spacing={0} />}
    </>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel || `${label}: ${value}`}
        accessibilityHint={accessibilityHint}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View accessibilityLabel={accessibilityLabel || `${label}: ${value}`}>
      {content}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default InfoRow;
