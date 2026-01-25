import { useState, useEffect } from 'react';
import { storage, getItem, setItem } from '../lib/mmkv';

/**
 * Generic hook for MMKV storage with React state integration
 * Provides automatic reactivity when storage values change
 *
 * @template T - The type of value being stored
 * @param key - The storage key
 * @param defaultValue - The default value if key doesn't exist
 * @returns [value, setValue] tuple similar to useState
 *
 * @example
 * ```tsx
 * // String storage
 * const [theme, setTheme] = useMMKVStorage<string>('theme', 'dark');
 *
 * // Array storage
 * const [favorites, setFavorites] = useMMKVStorage<string[]>('favorites', []);
 *
 * // Object storage
 * interface Settings {
 *   notifications: boolean;
 *   language: string;
 * }
 * const [settings, setSettings] = useMMKVStorage<Settings>('settings', {
 *   notifications: true,
 *   language: 'en'
 * });
 * ```
 */
export function useMMKVStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    // Initialize from storage or use default value
    try {
      const storedValue = getItem<T>(key);
      return storedValue !== undefined ? storedValue : defaultValue;
    } catch (error) {
      console.error(`Error reading initial value for key "${key}":`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    // Listen for changes to this specific key
    const listener = storage.addOnValueChangedListener((changedKey) => {
      if (changedKey === key) {
        try {
          const newValue = getItem<T>(key);
          if (newValue !== undefined) {
            setValue(newValue);
          } else {
            setValue(defaultValue);
          }
        } catch (error) {
          console.error(`Error handling storage change for key "${key}":`, error);
        }
      }
    });

    // Cleanup listener on unmount
    return () => {
      listener.remove();
    };
  }, [key, defaultValue]);

  /**
   * Update the storage value
   * @param value - New value or function to derive new value from previous value
   */
  const updateValue = (value: T | ((prev: T) => T)) => {
    try {
      setValue((prevValue) => {
        const newValue = value instanceof Function ? value(prevValue) : value;
        setItem(key, newValue);
        return newValue;
      });
    } catch (error) {
      console.error(`Error updating value for key "${key}":`, error);
    }
  };

  return [value, updateValue];
}

/**
 * Hook for managing multiple related storage keys
 * Useful for complex state management scenarios
 *
 * @template T - The type of value being stored
 * @param config - Object mapping keys to their default values
 * @returns Object with values and setters for each key
 *
 * @example
 * ```tsx
 * const { selectedMarket, timeframe, orderType } = useMMKVStorageGroup({
 *   selectedMarket: { key: 'market', default: 'BTC-USD' },
 *   timeframe: { key: 'timeframe', default: '1h' },
 *   orderType: { key: 'order_type', default: 'market' }
 * });
 * ```
 */
export function useMMKVStorageGroup<T extends Record<string, any>>(
  config: {
    [K in keyof T]: { key: string; default: T[K] };
  }
): {
  [K in keyof T]: T[K];
} & {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
} {
  const storageState = {} as any;

  // Create individual storage hooks for each key
  (Object.keys(config) as Array<keyof T>).forEach((propName) => {
    const { key, default: defaultVal } = config[propName];
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [value, setValue] = useMMKVStorage(key, defaultVal);
    storageState[propName] = value;
    storageState[`set${String(propName).charAt(0).toUpperCase() + String(propName).slice(1)}`] = setValue;
  });

  return storageState;
}
