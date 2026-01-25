/**
 * MMKV Storage utility for mobile app
 */

import { MMKV } from 'react-native-mmkv';

// Create a global MMKV instance
export const storage = new MMKV({
  id: 'scalex-mobile-storage',
  encryptionKey: 'scalex-encryption-key',
});

// Export convenience methods
export const storageUtils = {
  getString: (key: string) => storage.getString(key),
  getNumber: (key: string) => storage.getNumber(key),
  getBoolean: (key: string) => storage.getBoolean(key),
  set: (key: string, value: string | number | boolean) => storage.set(key, value),
  delete: (key: string) => storage.delete(key),
  getAllKeys: () => storage.getAllKeys(),
  clearAll: () => storage.clearAll(),
};
