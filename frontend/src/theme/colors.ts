export const lightColors = {
  // Primary Colors - Modern gradient blue-purple
  primary: {
    main: '#6366f1',
    light: '#a5b4fc',
    dark: '#4f46e5',
    contrast: '#ffffff',
  },

  // Secondary Colors - Vibrant teal
  secondary: {
    main: '#14b8a6',
    light: '#5eead4',
    dark: '#0f766e',
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

export const darkColors = {
  // Primary Colors - Modern gradient blue-purple (adjusted for dark mode)
  primary: {
    main: '#818cf8',
    light: '#a5b4fc',
    dark: '#6366f1',
    contrast: '#ffffff',
  },

  // Secondary Colors - Vibrant teal (adjusted for dark mode)
  secondary: {
    main: '#2dd4bf',
    light: '#5eead4',
    dark: '#14b8a6',
    contrast: '#000000',
  },

  // Success Colors
  success: {
    main: '#34d399',
    light: '#6ee7b7',
    dark: '#10b981',
    contrast: '#000000',
  },

  // Warning Colors
  warning: {
    main: '#fbbf24',
    light: '#fcd34d',
    dark: '#f59e0b',
    contrast: '#000000',
  },

  // Error Colors
  error: {
    main: '#f87171',
    light: '#fca5a5',
    dark: '#ef4444',
    contrast: '#ffffff',
  },

  // Info Colors
  info: {
    main: '#38bdf8',
    light: '#7dd3fc',
    dark: '#0ea5e9',
    contrast: '#000000',
  },

  // Neutral/Gray Colors (inverted for dark mode)
  neutral: {
    gray50: '#1f2937',
    gray100: '#374151',
    gray200: '#4b5563',
    gray300: '#6b7280',
    gray400: '#9ca3af',
    gray500: '#d1d5db',
    gray600: '#e5e7eb',
    gray700: '#f3f4f6',
    gray800: '#f9fafb',
    gray900: '#ffffff',
  },

  // Background Colors - Dark mode backgrounds
  background: {
    default: '#121212',
    paper: '#1E1E1E',
    variant: '#2C2C2C',
  },

  // Text Colors - Light text for dark backgrounds
  text: {
    primary: '#ffffff',
    secondary: '#b0b0b0',
    disabled: '#6b7280',
  },

  // Border Colors
  border: {
    default: '#374151',
    light: '#4b5563',
    dark: '#1f2937',
  },

  // Other
  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Card Colors
  card: {
    background: '#1E1E1E',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
} as const;

// Default export for backward compatibility
export const colors = lightColors;

export type ColorTokens = typeof lightColors;
