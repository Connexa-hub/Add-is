import { useState, useEffect, useCallback, useRef } from 'react';
import { offlineCache, CacheKey } from '../services/offlineCache';
import { useNetwork } from '../contexts/NetworkContext';

export type CachePolicy = 'cache-first' | 'network-first';

export interface UseCachedQueryOptions {
  ttl?: number;
  cachePolicy?: CachePolicy;
  enabled?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

export interface UseCachedQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: (forceNetwork?: boolean) => Promise<void>;
  isFromCache: boolean;
  isFetching: boolean;
}

export function useCachedQuery<T = any>(
  key: CacheKey,
  fetchFn: () => Promise<T>,
  options: UseCachedQueryOptions = {}
): UseCachedQueryResult<T> {
  const {
    ttl,
    cachePolicy = 'cache-first',
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const { isOnline } = useNetwork();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  
  const isMountedRef = useRef(true);
  const fetchAbortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (fetchAbortControllerRef.current) {
        fetchAbortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchData = useCallback(async (forceNetwork = false) => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    try {
      setIsFetching(true);
      setError(null);

      if (cachePolicy === 'cache-first' && !forceNetwork) {
        const cachedData = await offlineCache.get<T>(key);
        
        if (cachedData !== null) {
          console.log(`[useCachedQuery] Using cached data for ${key}`);
          if (isMountedRef.current) {
            setData(cachedData);
            setIsFromCache(true);
            setLoading(false);
            setIsFetching(false);
          }
          
          if (isOnline) {
            try {
              console.log(`[useCachedQuery] Fetching fresh data in background for ${key}`);
              fetchAbortControllerRef.current = new AbortController();
              const freshData = await fetchFn();
              
              if (isMountedRef.current) {
                setData(freshData);
                setIsFromCache(false);
                await offlineCache.set(key, freshData, ttl);
                if (onSuccess) onSuccess(freshData);
              }
            } catch (bgError) {
              console.warn(`[useCachedQuery] Background fetch failed for ${key}, keeping cached data:`, bgError);
            } finally {
              if (isMountedRef.current) {
                setIsFetching(false);
              }
            }
          }
          return;
        }
      }

      if (isOnline || forceNetwork) {
        console.log(`[useCachedQuery] Fetching network data for ${key}`);
        fetchAbortControllerRef.current = new AbortController();
        const freshData = await fetchFn();
        
        if (isMountedRef.current) {
          setData(freshData);
          setIsFromCache(false);
          setError(null);
          await offlineCache.set(key, freshData, ttl);
          if (onSuccess) onSuccess(freshData);
        }
      } else {
        const cachedData = await offlineCache.get<T>(key);
        
        if (cachedData !== null) {
          console.log(`[useCachedQuery] Offline - using cached data for ${key}`);
          if (isMountedRef.current) {
            setData(cachedData);
            setIsFromCache(true);
          }
        } else {
          const offlineError = new Error('No internet connection and no cached data available');
          if (isMountedRef.current) {
            setError(offlineError);
            if (onError) onError(offlineError);
          }
        }
      }
    } catch (err) {
      console.error(`[useCachedQuery] Error fetching ${key}:`, err);
      
      const cachedData = await offlineCache.get<T>(key);
      
      if (cachedData !== null) {
        console.log(`[useCachedQuery] Network error - falling back to cached data for ${key}`);
        if (isMountedRef.current) {
          setData(cachedData);
          setIsFromCache(true);
          setError(null);
        }
      } else {
        const fetchError = err instanceof Error ? err : new Error('Failed to fetch data');
        if (isMountedRef.current) {
          setError(fetchError);
          if (onError) onError(fetchError);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        setIsFetching(false);
      }
    }
  }, [key, fetchFn, ttl, cachePolicy, enabled, isOnline, onSuccess, onError]);

  const refetch = useCallback(
    async (forceNetwork = false) => {
      setLoading(true);
      await fetchData(forceNetwork);
    },
    [fetchData]
  );

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [enabled]);

  return {
    data,
    loading,
    error,
    refetch,
    isFromCache,
    isFetching,
  };
}
