import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_VERSION = '1.0.0';
const CACHE_VERSION_KEY = 'cache_version';

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  version: string;
  ttl: number;
}

export type CacheKey = 
  | 'banners'
  | 'service_lists'
  | 'user_profile_non_financial'
  | 'app_settings'
  | 'kyc_status'
  | 'airtime_providers'
  | 'data_providers'
  | 'airtime_packages'
  | 'data_packages'
  | 'tv_packages'
  | 'electricity_providers'
  | 'internet_providers'
  | 'betting_providers'
  | 'education_providers'
  | 'insurance_providers';

export const DEFAULT_TTLS: Record<string, number> = {
  banners: 30 * 60 * 1000, // 30 minutes
  service_lists: 60 * 60 * 1000, // 1 hour
  user_profile_non_financial: 60 * 60 * 1000, // 1 hour
  app_settings: 60 * 60 * 1000, // 1 hour
  kyc_status: 60 * 60 * 1000, // 1 hour
  airtime_providers: 60 * 60 * 1000, // 1 hour
  data_providers: 60 * 60 * 1000, // 1 hour
  airtime_packages: 60 * 60 * 1000, // 1 hour
  data_packages: 60 * 60 * 1000, // 1 hour
  tv_packages: 60 * 60 * 1000, // 1 hour
  electricity_providers: 60 * 60 * 1000, // 1 hour
  internet_providers: 60 * 60 * 1000, // 1 hour
  betting_providers: 60 * 60 * 1000, // 1 hour
  education_providers: 60 * 60 * 1000, // 1 hour
  insurance_providers: 60 * 60 * 1000, // 1 hour
};

const SENSITIVE_KEYS: CacheKey[] = [
  'user_profile_non_financial',
  'kyc_status',
  'app_settings'
];

const isSensitiveKey = (key: CacheKey): boolean => {
  return SENSITIVE_KEYS.includes(key);
};

const getStorageKey = (key: CacheKey): string => {
  return `cache_${key}`;
};

class OfflineCacheService {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const storedVersion = await AsyncStorage.getItem(CACHE_VERSION_KEY);
      
      if (storedVersion !== CACHE_VERSION) {
        console.log('[OfflineCache] Cache version mismatch, clearing all cache');
        await this.clear();
        await AsyncStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
      }
      
      this.initialized = true;
    } catch (error) {
      console.error('[OfflineCache] Initialization error:', error);
      this.initialized = true;
    }
  }

  async get<T = any>(key: CacheKey): Promise<T | null> {
    try {
      await this.initialize();

      const storageKey = getStorageKey(key);
      let entryJson: string | null = null;

      if (isSensitiveKey(key)) {
        entryJson = await SecureStore.getItemAsync(storageKey);
      } else {
        entryJson = await AsyncStorage.getItem(storageKey);
      }

      if (!entryJson) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(entryJson);

      if (entry.version !== CACHE_VERSION) {
        console.log(`[OfflineCache] Version mismatch for ${key}, clearing`);
        await this.remove(key);
        return null;
      }

      if (this.isExpired(entry)) {
        console.log(`[OfflineCache] Cache expired for ${key}`);
        await this.remove(key);
        return null;
      }

      console.log(`[OfflineCache] Cache hit for ${key}`);
      return entry.data;
    } catch (error) {
      console.error(`[OfflineCache] Error getting ${key}:`, error);
      return null;
    }
  }

  async set<T = any>(
    key: CacheKey, 
    data: T, 
    ttl?: number
  ): Promise<void> {
    try {
      await this.initialize();

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        ttl: ttl || DEFAULT_TTLS[key] || 60 * 60 * 1000,
      };

      const entryJson = JSON.stringify(entry);
      const storageKey = getStorageKey(key);

      if (isSensitiveKey(key)) {
        await SecureStore.setItemAsync(storageKey, entryJson);
      } else {
        await AsyncStorage.setItem(storageKey, entryJson);
      }

      console.log(`[OfflineCache] Cached ${key} with TTL ${entry.ttl}ms`);
    } catch (error) {
      console.error(`[OfflineCache] Error setting ${key}:`, error);
    }
  }

  async remove(key: CacheKey): Promise<void> {
    try {
      const storageKey = getStorageKey(key);

      if (isSensitiveKey(key)) {
        await SecureStore.deleteItemAsync(storageKey);
      } else {
        await AsyncStorage.removeItem(storageKey);
      }

      console.log(`[OfflineCache] Removed ${key}`);
    } catch (error) {
      console.error(`[OfflineCache] Error removing ${key}:`, error);
    }
  }

  async clear(): Promise<void> {
    try {
      const allKeys: CacheKey[] = [
        'banners',
        'service_lists',
        'user_profile_non_financial',
        'app_settings',
        'kyc_status',
        'airtime_providers',
        'data_providers',
        'airtime_packages',
        'data_packages',
        'tv_packages',
        'electricity_providers',
        'internet_providers',
        'betting_providers',
        'education_providers',
        'insurance_providers',
      ];

      await Promise.all(allKeys.map(key => this.remove(key)));
      
      console.log('[OfflineCache] Cleared all cache');
    } catch (error) {
      console.error('[OfflineCache] Error clearing cache:', error);
    }
  }

  isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.timestamp;
    return age > entry.ttl;
  }

  async isKeyExpired(key: CacheKey): Promise<boolean> {
    try {
      const storageKey = getStorageKey(key);
      let entryJson: string | null = null;

      if (isSensitiveKey(key)) {
        entryJson = await SecureStore.getItemAsync(storageKey);
      } else {
        entryJson = await AsyncStorage.getItem(storageKey);
      }

      if (!entryJson) {
        return true;
      }

      const entry: CacheEntry = JSON.parse(entryJson);
      return this.isExpired(entry);
    } catch (error) {
      console.error(`[OfflineCache] Error checking expiry for ${key}:`, error);
      return true;
    }
  }
}

export const offlineCache = new OfflineCacheService();
