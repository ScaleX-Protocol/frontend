/**
 * Persistent Log Storage
 * Stores logs in localStorage with optional backup to IndexedDB for large datasets
 */

import { LogEntry } from './logQuery';

export interface StorageConfig {
  useLocalStorage: boolean;
  useIndexedDB: boolean;
  maxLocalStorageSize: number; // in MB
  maxIndexedDBSize: number; // in MB
  compressionEnabled: boolean;
}

const DEFAULT_CONFIG: StorageConfig = {
  useLocalStorage: true,
  useIndexedDB: false,
  maxLocalStorageSize: 10, // 10MB
  maxIndexedDBSize: 100, // 100MB
  compressionEnabled: true
};

class PersistentLogStorage {
  private config: StorageConfig;
  private dbName = 'ScalexLogs';
  private storeName = 'logs';
  private db: IDBDatabase | null = null;

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize IndexedDB if enabled
   */
  async initIndexedDB(): Promise<void> {
    if (!this.config.useIndexedDB || typeof window === 'undefined') return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Store logs in localStorage
   */
  private storeInLocalStorage(logs: LogEntry[]): void {
    if (!this.config.useLocalStorage || typeof window === 'undefined') return;

    try {
      const serializedLogs = JSON.stringify(logs);

      // Check size limit
      const sizeInMB = new Blob([serializedLogs]).size / (1024 * 1024);
      if (sizeInMB > this.config.maxLocalStorageSize) {
        console.warn(`Log size (${sizeInMB}MB) exceeds localStorage limit (${this.config.maxLocalStorageSize}MB)`);
        // Keep only recent logs
        const recentLogs = logs.slice(-1000);
        localStorage.setItem('scalex_logs', JSON.stringify(recentLogs));
        return;
      }

      localStorage.setItem('scalex_logs', serializedLogs);
    } catch (error) {
      console.error('Failed to store logs in localStorage:', error);
      // Clear and try again with reduced logs
      try {
        const recentLogs = logs.slice(-500);
        localStorage.setItem('scalex_logs', JSON.stringify(recentLogs));
      } catch (retryError) {
        console.error('Failed to store even reduced logs:', retryError);
      }
    }
  }

  /**
   * Store logs in IndexedDB
   */
  private async storeInIndexedDB(logs: LogEntry[]): Promise<void> {
    if (!this.config.useIndexedDB || !this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      // Clear existing logs
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => {
        // Add all logs with unique IDs
        logs.forEach((log, index) => {
          const addRequest = store.add({
            ...log,
            id: `${log.timestamp}_${index}`
          });
        });

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      };

      clearRequest.onerror = () => reject(clearRequest.error);
    });
  }

  /**
   * Store logs persistently
   */
  async storeLogs(logs: LogEntry[]): Promise<void> {
    await this.initIndexedDB();

    // Store in localStorage
    if (this.config.useLocalStorage) {
      this.storeInLocalStorage(logs);
    }

    // Store in IndexedDB
    if (this.config.useIndexedDB) {
      await this.storeInIndexedDB(logs);
    }
  }

  /**
   * Retrieve logs from localStorage
   */
  private getFromLocalStorage(): LogEntry[] {
    if (!this.config.useLocalStorage || typeof window === 'undefined') {
      return [];
    }

    try {
      const stored = localStorage.getItem('scalex_logs');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to retrieve logs from localStorage:', error);
      return [];
    }
  }

  /**
   * Retrieve logs from IndexedDB
   */
  private async getFromIndexedDB(): Promise<LogEntry[]> {
    if (!this.config.useIndexedDB || !this.db) {
      return [];
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();

      request.onsuccess = () => {
        // Remove the temporary ID and sort by timestamp
        const logs = request.result.map((item: any) => {
          const { id, ...log } = item;
          return log;
        }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        resolve(logs);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Retrieve all logs from persistent storage
   */
  async getLogs(): Promise<LogEntry[]> {
    await this.initIndexedDB();

    let logs: LogEntry[] = [];

    // Try IndexedDB first (can store more logs)
    if (this.config.useIndexedDB) {
      try {
        const indexedDBLogs = await this.getFromIndexedDB();
        if (indexedDBLogs.length > 0) {
          logs = indexedDBLogs;
        }
      } catch (error) {
        console.error('Failed to retrieve from IndexedDB:', error);
      }
    }

    // Fallback to localStorage
    if (logs.length === 0 && this.config.useLocalStorage) {
      logs = this.getFromLocalStorage();
    }

    return logs;
  }

  /**
   * Clear all persistent logs
   */
  async clearLogs(): Promise<void> {
    // Clear localStorage
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      localStorage.removeItem('scalex_logs');
    }

    // Clear IndexedDB
    if (this.config.useIndexedDB && this.db) {
      return new Promise((resolve, reject) => {
        const transaction = this.db!.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    }
  }

  /**
   * Get storage usage statistics
   */
  async getStorageStats(): Promise<{
    localStorageUsed: number;
    localStorageAvailable: number;
    indexedDBUsed: number;
    totalLogs: number;
    oldestLog: string | null;
    newestLog: string | null;
  }> {
    const logs = await this.getLogs();

    let localStorageUsed = 0;
    let localStorageAvailable = 0;
    let indexedDBUsed = 0;

    // Calculate localStorage usage
    if (this.config.useLocalStorage && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('scalex_logs');
        localStorageUsed = stored ? new Blob([stored]).size : 0;

        // Estimate available space
        const testString = 'x'.repeat(1024 * 1024); // 1MB test string
        try {
          localStorage.setItem('storage_test', testString);
          localStorage.removeItem('storage_test');
          localStorageAvailable = 5 * 1024 * 1024; // Rough estimate: 5MB typically available
        } catch {
          localStorageAvailable = 0;
        }
      } catch (error) {
        console.error('Failed to calculate localStorage usage:', error);
      }
    }

    // Calculate IndexedDB usage (rough estimate)
    if (this.config.useIndexedDB && logs.length > 0) {
      indexedDBUsed = new Blob([JSON.stringify(logs)]).size;
    }

    return {
      localStorageUsed,
      localStorageAvailable,
      indexedDBUsed,
      totalLogs: logs.length,
      oldestLog: logs.length > 0 ? logs[0].timestamp : null,
      newestLog: logs.length > 0 ? logs[logs.length - 1].timestamp : null
    };
  }

  /**
   * Export logs to file with storage metadata
   */
  async exportLogsWithMetadata(): Promise<Blob> {
    const logs = await this.getLogs();
    const storageStats = await this.getStorageStats();

    const exportData = {
      metadata: {
        exportTime: new Date().toISOString(),
        totalLogs: logs.length,
        storageStats,
        config: this.config
      },
      logs
    };

    return new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
  }

  /**
   * Import logs from file
   */
  async importLogsFromFile(file: File): Promise<{ imported: number; errors: string[] }> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      const errors: string[] = [];
      let imported = 0;

      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const data = JSON.parse(content);

          let logsToImport: LogEntry[] = [];

          if (data.logs && Array.isArray(data.logs)) {
            // New format with metadata
            logsToImport = data.logs;
          } else if (Array.isArray(data)) {
            // Old format - just logs array
            logsToImport = data;
          } else {
            errors.push('Invalid file format');
            resolve({ imported: 0, errors });
            return;
          }

          // Validate logs
          const validLogs = logsToImport.filter(log => {
            if (!log.timestamp || !log.message) {
              errors.push(`Invalid log entry: ${JSON.stringify(log)}`);
              return false;
            }
            return true;
          });

          // Get existing logs
          const existingLogs = await this.getLogs();

          // Merge logs (avoid duplicates)
          const mergedLogs = [...existingLogs];
          validLogs.forEach(newLog => {
            const exists = mergedLogs.some(existingLog =>
              existingLog.timestamp === newLog.timestamp &&
              existingLog.message === newLog.message &&
              existingLog.wallet.userAddress === newLog.wallet.userAddress
            );

            if (!exists) {
              mergedLogs.push(newLog);
              imported++;
            }
          });

          // Sort by timestamp
          mergedLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

          // Store merged logs
          await this.storeLogs(mergedLogs);

          resolve({ imported, errors });
        } catch (error) {
          errors.push(`Failed to parse file: ${error}`);
          resolve({ imported: 0, errors });
        }
      };

      reader.onerror = () => {
        errors.push('Failed to read file');
        resolve({ imported: 0, errors });
      };

      reader.readAsText(file);
    });
  }
}

// Singleton instance
export const persistentLogStorage = new PersistentLogStorage();

// Storage configuration
export const configureLogStorage = (config: Partial<StorageConfig>) => {
  const newStorage = new PersistentLogStorage(config);
  // Note: In a real app, you might want to update the singleton or handle this differently
  return newStorage;
};