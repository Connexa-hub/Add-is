import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

export interface AppDividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacing?: number;
  thickness?: number;
  color?: string;
}

export const AppDivider: React.FC<AppDividerProps> = ({
  orientation = 'horizontal',
  spacing,
  thickness = 1,
  color,
}) => {
  const { tokens } = useAppTheme();

  const dividerColor = color || tokens.colors.border.default;
  const margin = spacing !== undefined ? spacing : tokens.spacing.base;

  const horizontalStyle: ViewStyle = {
    height: thickness,
    width: '100%' as any,
    backgroundColor: dividerColor,
    marginVertical: margin,
  };

  const verticalStyle: ViewStyle = {
    width: thickness,
    height: '100%' as any,
    backgroundColor: dividerColor,
    marginHorizontal: margin,
  };

  return (
    <View
      style={orientation === 'horizontal' ? horizontalStyle : verticalStyle}
      accessibilityRole="none"
    />
  );
};

export default AppDivider;
