import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { lightColors, darkColors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export const lightTokens = {
  colors: lightColors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export const darkTokens = {
  colors: darkColors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: lightColors.primary.main,
    onPrimary: lightColors.primary.contrast,
    primaryContainer: lightColors.primary.light,
    onPrimaryContainer: lightColors.text.primary,
    secondary: lightColors.success.main,
    onSecondary: lightColors.success.contrast,
    secondaryContainer: lightColors.success.light,
    onSecondaryContainer: lightColors.text.primary,
    tertiary: lightColors.info.main,
    onTertiary: lightColors.info.contrast,
    background: lightColors.background.default,
    onBackground: lightColors.text.primary,
    surface: lightColors.background.paper,
    onSurface: lightColors.text.primary,
    surfaceVariant: lightColors.neutral.gray100,
    onSurfaceVariant: lightColors.text.secondary,
    outline: lightColors.border.default,
    error: lightColors.error.main,
    onError: lightColors.error.contrast,
  },
  tokens: lightTokens,
} as const;

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary.main,
    onPrimary: darkColors.primary.contrast,
    primaryContainer: darkColors.primary.light,
    onPrimaryContainer: darkColors.text.primary,
    secondary: darkColors.success.main,
    onSecondary: darkColors.success.contrast,
    secondaryContainer: darkColors.success.light,
    onSecondaryContainer: darkColors.text.primary,
    tertiary: darkColors.info.main,
    onTertiary: darkColors.info.contrast,
    background: darkColors.background.default,
    onBackground: darkColors.text.primary,
    surface: darkColors.background.paper,
    onSurface: darkColors.text.primary,
    surfaceVariant: darkColors.neutral.gray100,
    onSurfaceVariant: darkColors.text.secondary,
    outline: darkColors.border.default,
    error: darkColors.error.main,
    onError: darkColors.error.contrast,
  },
  tokens: darkTokens,
} as const;

// Default theme (for backward compatibility)
export const theme = lightTheme;
export const tokens = lightTokens;

export type AppTheme = typeof lightTheme;

export { lightColors, darkColors, typography, spacing, radius, shadows };
