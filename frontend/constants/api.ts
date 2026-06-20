import { Platform } from 'react-native';

const getApiBaseUrl = () => {
  // If running in a browser, use relative path to connect to the host serving the app
  if (Platform.OS === 'web') {
    return '';
  }

  // If running on mobile (native), use the environment variable (set at build time)
  // or a fallback for local development.
  return process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:3001';
};

export const API_BASE_URL = getApiBaseUrl();
export const GITHUB_URL = '';
