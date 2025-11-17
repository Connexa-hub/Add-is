declare const process: {
  env: {
    EXPO_PUBLIC_API_BASE?: string;
    EXPO_PUBLIC_GITHUB_URL?: string;
  };
};

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE || 'https://add-is.onrender.com';
const GITHUB_URL = process.env.EXPO_PUBLIC_GITHUB_URL || '';

export { API_BASE_URL, GITHUB_URL };
