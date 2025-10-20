export const colors = {
  // Primary Colors - Updated for better contrast
  primary: {
    main: '#5c27d9',
    light: '#8854e0',
    dark: '#3d1a8f',
    contrast: '#ffffff',
  },

  // Secondary Colors
  secondary: {
    main: '#00bfa5',
    light: '#5df2d6',
    dark: '#008e76',
    contrast: '#ffffff',
  },

  // Success Colors
  success: {
    main: '#28a745',
    light: '#d4edda',
    dark: '#1e7e34',
    contrast: '#ffffff',
  },

  // Warning Colors
  warning: {
    main: '#ffc107',
    light: '#fff3cd',
    dark: '#e0a800',
    contrast: '#000000',
  },

  // Error Colors
  error: {
    main: '#dc3545',
    light: '#f8d7da',
    dark: '#bd2130',
    contrast: '#ffffff',
  },

  // Info Colors
  info: {
    main: '#17a2b8',
    light: '#d1ecf1',
    dark: '#117a8b',
    contrast: '#ffffff',
  },

  // Neutral/Gray Colors
  neutral: {
    gray50: '#f9fafb',
    gray100: '#f3f4f6',
    gray200: '#e5e7eb',
    gray300: '#d1d5db',
    gray400: '#9ca3af',
    gray500: '#6b7280',
    gray600: '#4b5563',
    gray700: '#374151',
    gray800: '#1f2937',
    gray900: '#111827',
  },

  // Background Colors
  background: {
    default: '#ffffff',
    paper: '#f8f9fa',
    variant: '#e9ecef',
  },

  // Text Colors - Improved contrast
  text: {
    primary: '#1a1a1a',
    secondary: '#4a4a4a',
    disabled: '#9e9e9e',
  },

  // Border Colors
  border: {
    default: '#dee2e6',
    light: '#e9ecef',
    dark: '#ced4da',
  },

  // Other
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Card Colors
  card: {
    background: '#ffffff',
    shadow: 'rgba(0, 0, 0, 0.08)',
  },
} as const;

export type ColorTokens = typeof colors;