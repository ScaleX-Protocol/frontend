import { useEffect, ReactNode } from 'react';
import { MMKV } from 'react-native-mmkv';

// Initialize MMKV storage
const storage = new MMKV();

// Storage adapter for platform-agnostic usage
export const mmkvAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    return storage.getString(key) || null;
  },
  setItem: async (key: string, value: string): Promise<void> => {
    storage.set(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    storage.delete(key);
  },
  clear: async (): Promise<void> => {
    storage.clearAll();
  },
};

export function StorageProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Initialize storage on mount
    console.log('MMKV Storage initialized');
  }, []);

  return <>{children}</>;
}

// Export storage instance for direct use
export { storage };
