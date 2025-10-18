import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import AppText from './AppText';

export interface AppInputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: object;
  disabled?: boolean;
}

export const AppInput: React.FC<AppInputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  disabled,
  ...props
}) => {
  const { tokens } = useAppTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return tokens.colors.error.main;
    if (isFocused) return tokens.colors.primary.main;
    return tokens.colors.border.default;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <AppText variant="subtitle2" style={{ marginBottom: tokens.spacing.xs, color: tokens.colors.text.secondary }}>
          {label}
        </AppText>
      )}
      <View
        style={[
          styles.inputContainer,
          {
            borderColor: getBorderColor(),
            borderRadius: tokens.radius.base,
            paddingHorizontal: tokens.spacing.md,
            paddingVertical: tokens.spacing.md,
            backgroundColor: tokens.colors.background.default,
          },
        ]}
      >
        {leftIcon && <View style={{ marginRight: tokens.spacing.sm }}>{leftIcon}</View>}
        <TextInput
          style={[
            styles.input,
            { color: tokens.colors.text.primary },
            disabled && { opacity: 0.6 },
          ]}
          placeholderTextColor={tokens.colors.text.disabled}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          editable={!disabled}
          {...props}
        />
        {rightIcon && <View style={{ marginLeft: tokens.spacing.sm }}>{rightIcon}</View>}
      </View>
      {error && (
        <AppText variant="caption" style={{ marginTop: tokens.spacing.xs, color: tokens.colors.error.main }}>
          {error}
        </AppText>
      )}
      {helperText && !error && (
        <AppText variant="caption" style={{ marginTop: tokens.spacing.xs, color: tokens.colors.text.secondary }}>
          {helperText}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  input: {
    flex: 1,
    padding: 0,
  },
});

export default AppInput;