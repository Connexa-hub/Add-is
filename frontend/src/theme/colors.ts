export const colors = {
  // Primary Colors - Updated for better contrast
  primary: '#5c27d9',
  primaryLight: '#8854e0',
  primaryDark: '#3d1a8f',

  // Secondary Colors
  secondary: '#00bfa5',
  secondaryLight: '#5df2d6',
  secondaryDark: '#008e76',

  // Background Colors
  background: '#ffffff',
  surface: '#f8f9fa',
  surfaceVariant: '#e9ecef',

  // Text Colors - Improved contrast
  text: '#1a1a1a',
  textSecondary: '#4a4a4a',
  textDisabled: '#9e9e9e',
  onPrimary: '#ffffff',
  onSecondary: '#ffffff',

  // Status Colors
  success: '#28a745',
  successLight: '#d4edda',
  warning: '#ffc107',
  warningLight: '#fff3cd',
  error: '#dc3545',
  errorLight: '#f8d7da',
  info: '#17a2b8',
  infoLight: '#d1ecf1',

  // Border Colors
  border: '#dee2e6',
  divider: '#ced4da',

  // Other
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Card Colors
  cardBackground: '#ffffff',
  cardShadow: 'rgba(0, 0, 0, 0.08)',
} as const;

export type ColorTokens = typeof colors;