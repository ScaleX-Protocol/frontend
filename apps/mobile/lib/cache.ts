import { getItem, setItem } from '~/src/lib/mmkv';

// Cache duration constants (in milliseconds)
export const CACHE_DURATIONS = {
  MARKETS: 5 * 60 * 1000, // 5 minutes
  KLINES: 2 * 60 * 1000, // 2 minutes
  TICKER: 30 * 1000, // 30 seconds
  ORDER_BOOK: 1 * 1000, // 1 second (real-time data)
};

interface CachedData<T> {
  data: T;
  timestamp: number;
  duration: number;
}

/**
 * Check if cached data is still valid
 */
export function isCacheValid(timestamp: number, duration: number): boolean {
  const now = Date.now();
  return now - timestamp < duration;
}

/**
 * Get cached data if available and valid
 */
export function getCachedData<T>(key: string): T | null {
  try {
    const cached = getItem<CachedData<T>>(key);
    if (!cached) {
      return null;
    }

    if (isCacheValid(cached.timestamp, cached.duration)) {
      return cached.data;
    }

    // Cache expired, remove it
    return null;
  } catch (error) {
    console.error(`Error reading cache for key "${key}":`, error);
    return null;
  }
}

/**
 * Set cached data with timestamp
 */
export function setCachedData<T>(
  key: string,
  data: T,
  duration: number
): void {
  try {
    const cacheEntry: CachedData<T> = {
      data,
      timestamp: Date.now(),
      duration,
    };
    setItem(key, cacheEntry);
  } catch (error) {
    console.error(`Error setting cache for key "${key}":`, error);
  }
}

/**
 * Clear specific cache entry
 */
export function clearCache(key: string): void {
  try {
    setItem(key, null);
  } catch (error) {
    console.error(`Error clearing cache for key "${key}":`, error);
  }
}

/**
 * Clear all API caches
 */
export function clearAllAPICaches(): void {
  const cacheKeys = [
    'cache:markets',
    'cache:klines:',
    'cache:ticker:',
    'cache:order_book:',
  ];

  cacheKeys.forEach((key) => {
    try {
      setItem(key, null);
    } catch (error) {
      console.error(`Error clearing cache for key "${key}":`, error);
    }
  });
}

/**
 * Wrapper for data fetching with caching
 * @param key - Cache key
 * @param fetcher - Function to fetch fresh data
 * @param duration - Cache duration in milliseconds
 * @returns Cached data if valid, otherwise fetches fresh data
 */
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  duration: number
): Promise<T> {
  // Try to get cached data
  const cached = getCachedData<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const freshData = await fetcher();

  // Cache the fresh data
  setCachedData(key, freshData, duration);

  return freshData;
}
