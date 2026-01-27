/**
 * Mobile-optimized API client with offline support and caching
 */

import { fetchIndexerAPI, fetchAPI } from '@scalex/api-client';
import { storage } from '../storage';
import NetInfo from '@react-native-community/netinfo';

const CACHE_PREFIX = 'api_cache_';
const CACHE_TIMESTAMP_SUFFIX = '_timestamp';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  staleWhileRevalidate?: boolean;
  offlineFirst?: boolean;
}

/**
 * Check if we're online
 */
export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

/**
 * Get cached data
 */
function getCachedData<T>(key: string): T | null {
  try {
    const cached = storage.getString(`${CACHE_PREFIX}${key}`);
    if (!cached) return null;

    const data = JSON.parse(cached);
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Check if cache is stale
 */
function isCacheStale(key: string, ttl: number): boolean {
  try {
    const timestamp = storage.getNumber(`${CACHE_PREFIX}${key}${CACHE_TIMESTAMP_SUFFIX}`);
    if (!timestamp) return true;

    return Date.now() - timestamp > ttl;
  } catch {
    return true;
  }
}

/**
 * Set cached data
 */
function setCachedData<T>(key: string, data: T): void {
  try {
    storage.set(`${CACHE_PREFIX}${key}`, JSON.stringify(data));
    storage.set(`${CACHE_PREFIX}${key}${CACHE_TIMESTAMP_SUFFIX}`, Date.now());
  } catch (error) {
    console.warn('Failed to cache data:', error);
  }
}

/**
 * Mobile-optimized fetch for indexer API with caching and offline support
 */
export async function fetchIndexerAPIMobile<T>(
  endpoint: string,
  options?: RequestInit,
  cacheOptions?: CacheOptions
): Promise<T> {
  const cacheKey = `indexer_${endpoint}`;
  const { ttl = 30000, staleWhileRevalidate = true, offlineFirst = false } = cacheOptions || {};

  // Check if we're offline
  const online = await isOnline();

  // Offline-first: return cache immediately if available
  if (offlineFirst || !online) {
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      // If online and stale, refetch in background
      if (online && staleWhileRevalidate && isCacheStale(cacheKey, ttl)) {
        fetchIndexerAPI<T>(endpoint, options)
          .then(data => setCachedData(cacheKey, data))
          .catch(err => console.warn('Background refetch failed:', err));
      }
      return cached;
    }

    if (!online) {
      throw new Error('No cached data available and device is offline');
    }
  }

  try {
    const data = await fetchIndexerAPI<T>(endpoint, options);
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    // On error, return stale cache if available
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      console.warn('API fetch failed, returning stale cache:', error);
      return cached;
    }
    throw error;
  }
}

/**
 * Mobile-optimized fetch for backend API with caching and offline support
 */
export async function fetchAPIMobile<T>(
  endpoint: string,
  options?: RequestInit,
  cacheOptions?: CacheOptions
): Promise<T> {
  const cacheKey = `backend_${endpoint}`;
  const { ttl = 30000, staleWhileRevalidate = true, offlineFirst = false } = cacheOptions || {};

  // Check if we're offline
  const online = await isOnline();

  // Offline-first: return cache immediately if available
  if (offlineFirst || !online) {
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      // If online and stale, refetch in background
      if (online && staleWhileRevalidate && isCacheStale(cacheKey, ttl)) {
        fetchAPI<T>(endpoint, options)
          .then(data => setCachedData(cacheKey, data))
          .catch(err => console.warn('Background refetch failed:', err));
      }
      return cached;
    }

    if (!online) {
      throw new Error('No cached data available and device is offline');
    }
  }

  try {
    const data = await fetchAPI<T>(endpoint, options);
    setCachedData(cacheKey, data);
    return data;
  } catch (error) {
    // On error, return stale cache if available
    const cached = getCachedData<T>(cacheKey);
    if (cached) {
      console.warn('API fetch failed, returning stale cache:', error);
      return cached;
    }
    throw error;
  }
}

/**
 * Clear all API cache
 */
export function clearAPICache(): void {
  try {
    const keys = storage.getAllKeys();
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        storage.delete(key);
      }
    });
  } catch (error) {
    console.warn('Failed to clear API cache:', error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCacheEntry(endpoint: string, type: 'indexer' | 'backend'): void {
  try {
    const cacheKey = `${type}_${endpoint}`;
    storage.delete(`${CACHE_PREFIX}${cacheKey}`);
    storage.delete(`${CACHE_PREFIX}${cacheKey}${CACHE_TIMESTAMP_SUFFIX}`);
  } catch (error) {
    console.warn('Failed to clear cache entry:', error);
  }
}
