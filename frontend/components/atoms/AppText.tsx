import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';

export type TextVariant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'button' | 'caption' | 'overline';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  color?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  children: React.ReactNode;
}

export const AppText: React.FC<AppTextProps> = ({
  variant = 'body1',
  color,
  align = 'left',
  weight,
  style,
  children,
  ...props
}) => {
  const { tokens } = useAppTheme();

  const variantStyle = tokens.typography.variants[variant];

  const textStyle = {
    fontSize: variantStyle.fontSize,
    fontWeight: weight || variantStyle.fontWeight,
    lineHeight: variantStyle.lineHeight * variantStyle.fontSize,
    color: color || tokens.colors.text.primary,
    textAlign: align,
    letterSpacing: 'letterSpacing' in variantStyle ? variantStyle.letterSpacing : 0,
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};

export default AppText;
