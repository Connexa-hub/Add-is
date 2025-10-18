import { MD3LightTheme } from 'react-native-paper';
import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';
import { radius } from './radius';
import { shadows } from './shadows';

export const tokens = {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} as const;

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary.main,
    onPrimary: colors.primary.contrast,
    primaryContainer: colors.primary.light,
    onPrimaryContainer: colors.text.primary,
    secondary: colors.success.main,
    onSecondary: colors.success.contrast,
    secondaryContainer: colors.success.light,
    onSecondaryContainer: colors.text.primary,
    tertiary: colors.info.main,
    onTertiary: colors.info.contrast,
    background: colors.background.default,
    onBackground: colors.text.primary,
    surface: colors.background.paper,
    onSurface: colors.text.primary,
    surfaceVariant: colors.neutral.gray100,
    onSurfaceVariant: colors.text.secondary,
    outline: colors.border.default,
    error: colors.error.main,
    onError: colors.error.contrast,
  },
  tokens,
} as const;

export type AppTheme = typeof theme;

export { colors, typography, spacing, radius, shadows };
