import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const LEGACY_TOKEN_KEY = 'token';

export interface TokenService {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  getRefreshToken(): Promise<string | null>;
  setTokens(accessToken: string, refreshToken: string): Promise<void>;
  clearToken(): Promise<void>;
}

class SecureTokenService implements TokenService {
  async getToken(): Promise<string | null> {
    try {
      // Try SecureStore first
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      
      if (token) {
        return token;
      }
      
      // Fall back to AsyncStorage for backward compatibility
      const asyncToken = await AsyncStorage.getItem('token');
      if (asyncToken) {
        console.log('Found token in AsyncStorage, migrating to SecureStore');
        await this.setToken(asyncToken);
        return asyncToken;
      }
      
      // Check legacy location
      const legacyToken = await AsyncStorage.getItem(LEGACY_TOKEN_KEY);
      if (legacyToken) {
        console.log('Migrating legacy token to SecureStore');
        await this.setToken(legacyToken);
        await AsyncStorage.removeItem(LEGACY_TOKEN_KEY);
        return legacyToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    await this.setToken(accessToken);
    try {
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error setting refresh token:', error);
      throw error;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      // Validate token is a string
      if (!token || typeof token !== 'string') {
        throw new Error('Token must be a non-empty string');
      }

      // Primary: Write to SecureStore (secure, encrypted)
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
      
      // Backward compatibility: Also write to AsyncStorage for screens still using it
      // This ensures smooth transition and prevents session loss
      await AsyncStorage.setItem('token', token);
    } catch (error) {
      console.error('Error setting auth token:', error);
      throw error;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
        AsyncStorage.removeItem('token'),
        AsyncStorage.removeItem(LEGACY_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing auth token:', error);
      throw error;
    }
  }
}

export const tokenService = new SecureTokenService();
