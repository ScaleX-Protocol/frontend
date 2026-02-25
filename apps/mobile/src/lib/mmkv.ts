import { MMKV } from 'react-native-mmkv';

// Safe MMKV initialization with error handling
let storageInstance: MMKV | null = null;
let initializationError: Error | null = null;

/**
 * Initialize MMKV storage with error handling
 * This is called lazily to ensure the native module is ready
 */
function initializeStorage(): MMKV {
  if (storageInstance) {
    return storageInstance;
  }

  if (initializationError) {
    throw initializationError;
  }

  try {
    storageInstance = new MMKV();
    return storageInstance;
  } catch (error) {
    initializationError = error as Error;
    console.error('[MMKV] Failed to initialize storage:', error);
    throw new Error('MMKV storage initialization failed. Please restart the app.');
  }
}

/**
 * Get the MMKV storage instance
 * Ensures storage is initialized before returning
 */
export function getStorage(): MMKV {
  return initializeStorage();
}

// Export storage instance with lazy initialization
export const storage = new Proxy({} as MMKV, {
  get: (target, prop) => {
    const instance = initializeStorage();
    const value = (instance as any)[prop];
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});

/**
 * Set an item in storage
 * @param key - The storage key
 * @param value - The value to store (will be JSON stringified)
 */
export const setItem = <T>(key: string, value: T): void => {
  try {
    storage.set(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting item for key "${key}":`, error);
  }
};

/**
 * Get an item from storage
 * @param key - The storage key
 * @returns The parsed value or undefined if not found
 */
export const getItem = <T>(key: string): T | undefined => {
  try {
    const value = storage.getString(key);
    if (value === undefined) {
      return undefined;
    }
    return JSON.parse(value) as T;
  } catch (error) {
    console.error(`Error getting item for key "${key}":`, error);
    return undefined;
  }
};

/**
 * Remove an item from storage
 * @param key - The storage key
 */
export const removeItem = (key: string): void => {
  try {
    storage.delete(key);
  } catch (error) {
    console.error(`Error removing item for key "${key}":`, error);
  }
};

/**
 * Check if a key exists in storage
 * @param key - The storage key
 * @returns True if the key exists, false otherwise
 */
export const hasKey = (key: string): boolean => {
  try {
    return storage.contains(key);
  } catch (error) {
    console.error(`Error checking key "${key}":`, error);
    return false;
  }
};

/**
 * Get all keys from storage
 * @returns Array of all keys
 */
export const getAllKeys = (): string[] => {
  try {
    return storage.getAllKeys();
  } catch (error) {
    console.error('Error getting all keys:', error);
    return [];
  }
};

/**
 * Clear all items from storage
 */
export const clearAll = (): void => {
  try {
    const keys = storage.getAllKeys();
    keys.forEach((key) => storage.delete(key));
  } catch (error) {
    console.error('Error clearing all items:', error);
  }
};
