const getApiBaseUrl = () => {
  const configuredUrl = process.env.EXPO_PUBLIC_API_BASE || 'http://localhost:5000';
  const browserHost = typeof window !== 'undefined' ? window.location.hostname : '';

  if (browserHost && browserHost !== 'localhost' && browserHost !== '127.0.0.1') {
    return 'http://' + browserHost + ':5000';
  }

  return configuredUrl;
};

export const API_BASE_URL = getApiBaseUrl();
export const GITHUB_URL = '';
