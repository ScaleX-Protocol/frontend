import { MMKV } from 'react-native-mmkv';

// Create MMKV instance
export const storage = new MMKV();

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
