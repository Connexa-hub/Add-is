import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AUTH_TOKEN_KEY = 'auth_token';
const LEGACY_TOKEN_KEY = 'token';

export interface TokenService {
  getToken(): Promise<string | null>;
  setToken(token: string): Promise<void>;
  clearToken(): Promise<void>;
}

class SecureTokenService implements TokenService {
  async getToken(): Promise<string | null> {
    try {
      const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
      
      if (token) {
        return token;
      }
      
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

  async setToken(token: string): Promise<void> {
    try {
      // Only write to SecureStore (secure, encrypted)
      // Never write to AsyncStorage - that's a security vulnerability
      await SecureStore.setItemAsync(AUTH_TOKEN_KEY, token);
    } catch (error) {
      console.error('Error setting auth token:', error);
      throw error;
    }
  }

  async clearToken(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        AsyncStorage.removeItem(LEGACY_TOKEN_KEY),
      ]);
    } catch (error) {
      console.error('Error clearing auth token:', error);
      throw error;
    }
  }
}

export const tokenService = new SecureTokenService();
