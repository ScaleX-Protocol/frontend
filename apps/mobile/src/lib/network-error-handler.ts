import { showToast } from '../components/shared/toast';

/**
 * Network error handler with exponential backoff retry logic
 */

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
  showRetryToast?: boolean;
}

export interface RetryResult<T> {
  data: T | null;
  error: Error | null;
  attempt: number;
}

/**
 * Retry a function with exponential backoff
 * Delays: 1s, 2s, 4s, 8s (default)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const {
    maxRetries = 4,
    baseDelay = 1000,
    maxDelay = 8000,
    onRetry,
    showRetryToast = true,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fn();
      return { data, error: null, attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      // Show retry toast on first retry attempt
      if (showRetryToast && attempt === 0) {
        showToast(
          'error',
          'Network error. Retrying...',
          2000
        );
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, lastError);
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  return { data: null, error: lastError, attempt: maxRetries };
}

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: Error): boolean {
  // Check for common network error patterns
  return (
    error.message.includes('Network request failed') ||
    error.message.includes('Network Error') ||
    error.message.includes('ECONNREFUSED') ||
    error.message.includes('ENOTFOUND') ||
    error.message.includes('ETIMEDOUT') ||
    error.message.includes('timeout') ||
    error.message.includes('fetch')
  );
}

/**
 * Wrapper for fetch with retry logic
 */
export async function fetchWithRetry<T>(
  url: string,
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<RetryResult<T>> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return (await response.json()) as T;
    },
    retryOptions
  );
}

/**
 * Get cached data from storage as fallback
 */
export async function getCachedData<T>(
  key: string,
  storage: {
    getItem: (key: string) => Promise<string | null>;
  }
): Promise<T | null> {
  try {
    const cached = await storage.getItem(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }
    return null;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
}

/**
 * Cache data to storage
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  storage: {
    setItem: (key: string, value: string) => Promise<void>;
  }
): Promise<void> {
  try {
    await storage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
}

/**
 * Fetch with retry and cache fallback
 */
export async function fetchWithRetryAndCache<T>(
  url: string,
  cacheKey: string,
  storage: {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
  },
  options?: RequestInit,
  retryOptions?: RetryOptions
): Promise<RetryResult<T>> {
  // Try to fetch with retry
  const result = await fetchWithRetry<T>(url, options, retryOptions);

  // If successful, cache the data
  if (result.data) {
    await setCachedData(cacheKey, result.data, storage);
  }

  // If failed, try to return cached data
  if (result.error) {
    console.log('Network request failed, trying cache...');
    const cached = await getCachedData<T>(cacheKey, storage);
    if (cached) {
      showToast('info', 'Using cached data', 2000);
      return { data: cached, error: null, attempt: result.attempt };
    }
  }

  return result;
}
