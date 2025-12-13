/**
 * Log Query and Analysis Utility
 * Provides easy ways to query and analyze logs from the logging system
 */

import { persistentLogStorage } from './logStorage';
import { logger } from './prodLogger';

export interface LogQuery {
  level?: string;
  walletAddress?: string;
  service?: string;
  label?: string;
  function?: string;
  filename?: string;
  startTime?: Date;
  endTime?: Date;
  search?: string;
  limit?: number;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  wallet: {
    userAddress?: string;
    embeddedWalletAddress?: string;
    email?: string;
    userId?: string;
  };
  service: string;
  label: string;
  filename: string;
  function: string;
  data?: any;
  browser?: any;
}

/**
 * In-memory log storage for querying
 */
class LogStore {
  private logs: LogEntry[] = [];
  private maxLogs = 10000; // Prevent memory issues
  private isInitialized = false;
  private log = logger.withContext({ component: 'LogStore' });

  // Initialize on first use
  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Load existing logs from persistent storage
      this.logs = await persistentLogStorage.getLogs();
      this.isInitialized = true;
      this.log.info(`Loaded ${this.logs.length} logs from persistent storage`);
    } catch (error) {
      this.log.error('Failed to load logs from persistent storage', error);
      this.logs = [];
      this.isInitialized = true;
    }
  }

  addLog(logEntry: LogEntry) {
    // Ensure we're initialized
    if (!this.isInitialized) {
      // Initialize synchronously for immediate use
      try {
        const storedLogs = typeof window !== 'undefined'
          ? JSON.parse(localStorage.getItem('scalex_logs') || '[]')
          : [];
        this.logs = Array.isArray(storedLogs) ? storedLogs : [];
        this.isInitialized = true;
      } catch {
        this.logs = [];
        this.isInitialized = true;
      }
    }

    this.logs.push(logEntry);

    // Prevent memory leaks by removing old logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs * 0.8);
    }

    // Persist to storage (non-blocking)
    this.persistLogs();
  }

  private async persistLogs() {
    try {
      await persistentLogStorage.storeLogs(this.logs);
    } catch (error) {
      // Fallback to localStorage if IndexedDB fails
      try {
        localStorage.setItem('scalex_logs', JSON.stringify(this.logs));
      } catch (localStorageError) {
        this.log.error('Failed to persist logs', localStorageError);
      }
    }
  }

  query(query: LogQuery): LogEntry[] {
    let filteredLogs = [...this.logs];

    // Filter by level
    if (query.level) {
      filteredLogs = filteredLogs.filter(log =>
        log.level.toLowerCase() === query.level!.toLowerCase()
      );
    }

    // Filter by wallet address (supports partial matches)
    if (query.walletAddress) {
      const walletLower = query.walletAddress.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        (log.wallet.userAddress && log.wallet.userAddress.toLowerCase().includes(walletLower)) ||
        (log.wallet.embeddedWalletAddress && log.wallet.embeddedWalletAddress.toLowerCase().includes(walletLower))
      );
    }

    // Filter by service
    if (query.service) {
      filteredLogs = filteredLogs.filter(log =>
        log.service.toLowerCase().includes(query.service!.toLowerCase())
      );
    }

    // Filter by label
    if (query.label) {
      filteredLogs = filteredLogs.filter(log =>
        log.label.toLowerCase().includes(query.label!.toLowerCase())
      );
    }

    // Filter by function
    if (query.function) {
      filteredLogs = filteredLogs.filter(log =>
        log.function.toLowerCase().includes(query.function!.toLowerCase())
      );
    }

    // Filter by filename
    if (query.filename) {
      filteredLogs = filteredLogs.filter(log =>
        log.filename.toLowerCase().includes(query.filename!.toLowerCase())
      );
    }

    // Filter by time range
    if (query.startTime) {
      const startTime = new Date(query.startTime);
      filteredLogs = filteredLogs.filter(log =>
        new Date(log.timestamp) >= startTime
      );
    }

    if (query.endTime) {
      const endTime = new Date(query.endTime);
      filteredLogs = filteredLogs.filter(log =>
        new Date(log.timestamp) <= endTime
      );
    }

    // Search in message and data
    if (query.search) {
      const searchTerm = query.search.toLowerCase();
      filteredLogs = filteredLogs.filter(log =>
        log.message.toLowerCase().includes(searchTerm) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchTerm))
      );
    }

    // Sort by timestamp (newest first)
    filteredLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Apply limit
    if (query.limit) {
      filteredLogs = filteredLogs.slice(0, query.limit);
    }

    return filteredLogs;
  }

  /**
   * Get aggregated statistics about logs
   */
  getStats() {
    const stats = {
      totalLogs: this.logs.length,
      byLevel: {} as Record<string, number>,
      byWallet: {} as Record<string, number>,
      byService: {} as Record<string, number>,
      byLabel: {} as Record<string, number>,
      errorRate: 0,
      mostActiveWallets: [] as Array<{ address: string; count: number }>,
      recentErrors: [] as LogEntry[]
    };

    this.logs.forEach(log => {
      // Count by level
      stats.byLevel[log.level] = (stats.byLevel[log.level] || 0) + 1;

      // Count by wallet
      if (log.wallet.userAddress) {
        stats.byWallet[log.wallet.userAddress] = (stats.byWallet[log.wallet.userAddress] || 0) + 1;
      }

      // Count by service
      stats.byService[log.service] = (stats.byService[log.service] || 0) + 1;

      // Count by label
      stats.byLabel[log.label] = (stats.byLabel[log.label] || 0) + 1;

      // Collect recent errors
      if (log.level === 'ERROR') {
        stats.recentErrors.push(log);
        if (stats.recentErrors.length > 100) {
          stats.recentErrors = stats.recentErrors.slice(0, 100);
        }
      }
    });

    // Calculate error rate
    const errorCount = stats.byLevel['ERROR'] || 0;
    stats.errorRate = (errorCount / stats.totalLogs) * 100;

    // Get most active wallets
    stats.mostActiveWallets = Object.entries(stats.byWallet)
      .map(([address, count]) => ({ address, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return stats;
  }

  /**
   * Export logs to different formats
   */
  exportLogs(format: 'json' | 'csv' | 'txt' = 'json', query?: LogQuery): string {
    const logs = query ? this.query(query) : this.logs;

    switch (format) {
      case 'json':
        return JSON.stringify(logs, null, 2);

      case 'csv':
        if (logs.length === 0) return '';

        const headers = ['timestamp', 'level', 'service', 'label', 'wallet', 'message', 'filename', 'function'];
        const csvRows = [headers.join(',')];

        logs.forEach(log => {
          const row = [
            log.timestamp,
            log.level,
            log.service,
            log.label,
            log.wallet.userAddress || '',
            `"${log.message.replace(/"/g, '""')}"`,
            log.filename,
            log.function
          ];
          csvRows.push(row.join(','));
        });

        return csvRows.join('\n');

      case 'txt':
        return logs.map(log =>
          `[${log.timestamp}] [${log.level}] [${log.service}/${log.label}] [${log.wallet.userAddress || 'NO_WALLET'}] ${log.function}() - ${log.message}`
        ).join('\n');

      default:
        return '';
    }
  }

  /**
   * Clear all logs
   */
  async clear() {
    this.logs = [];
    try {
      await persistentLogStorage.clearLogs();
    } catch (error) {
      // Fallback to localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('scalex_logs');
      }
    }
  }

  /**
   * Get all logs
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }
}

// Singleton instance
export const logStore = new LogStore();

/**
 * Quick query functions
 */
export const logQuery = {
  /**
   * Get all logs for a specific wallet
   */
  byWallet: (walletAddress: string, limit?: number) =>
    logStore.query({ walletAddress, limit }),

  /**
   * Get all error logs
   */
  errors: (limit?: number) =>
    logStore.query({ level: 'ERROR', limit }),

  /**
   * Get all transaction logs
   */
  transactions: (walletAddress?: string, limit?: number) =>
    logStore.query({
      search: 'transaction',
      walletAddress,
      limit
    }),

  /**
   * Get logs by time range
   */
  byTimeRange: (startTime: Date, endTime: Date, walletAddress?: string) =>
    logStore.query({
      startTime,
      endTime,
      walletAddress
    }),

  /**
   * Search logs
   */
  search: (searchTerm: string, options?: Partial<LogQuery>) =>
    logStore.query({ search: searchTerm, ...options }),

  /**
   * Get recent logs
   */
  recent: (minutes = 60, walletAddress?: string) => {
    const startTime = new Date(Date.now() - minutes * 60 * 1000);
    return logStore.query({ startTime, walletAddress });
  },

  /**
   * Get logs for a specific function
   */
  byFunction: (functionName: string, filename?: string) =>
    logStore.query({ function: functionName, filename }),

  /**
   * Get contract interaction logs
   */
  contractCalls: (contractName?: string, functionName?: string) =>
    logStore.query({
      search: 'contract',
      service: 'frontend'
    }),
};

/**
 * Log analysis functions
 */
export const logAnalysis = {
  /**
   * Get user activity summary
   */
  getUserActivity: (walletAddress: string) => {
    const userLogs = logStore.query({ walletAddress });
    const activity = {
      totalActions: userLogs.length,
      transactions: userLogs.filter(log => log.message.includes('transaction')).length,
      errors: userLogs.filter(log => log.level === 'ERROR').length,
      lastSeen: userLogs.length > 0 ? userLogs[0].timestamp : null,
      actionsByType: {} as Record<string, number>,
      timeline: userLogs.slice(0, 20).map(log => ({
        timestamp: log.timestamp,
        action: log.message,
        level: log.level
      }))
    };

    userLogs.forEach(log => {
      activity.actionsByType[log.label] = (activity.actionsByType[log.label] || 0) + 1;
    });

    return activity;
  },

  /**
   * Get error analysis
   */
  getErrorAnalysis: (timeWindowHours = 24) => {
    const startTime = new Date(Date.now() - timeWindowHours * 60 * 60 * 1000);
    const errorLogs = logStore.query({
      level: 'ERROR',
      startTime
    });

    const errorsByFunction = {} as Record<string, number>;
    const errorsByWallet = {} as Record<string, number>;
    const errorsByMessage = {} as Record<string, number>;

    errorLogs.forEach(log => {
      const funcKey = `${log.filename}:${log.function}`;
      errorsByFunction[funcKey] = (errorsByFunction[funcKey] || 0) + 1;

      if (log.wallet.userAddress) {
        errorsByWallet[log.wallet.userAddress] = (errorsByWallet[log.wallet.userAddress] || 0) + 1;
      }

      errorsByMessage[log.message] = (errorsByMessage[log.message] || 0) + 1;
    });

    return {
      totalErrors: errorLogs.length,
      errorsByFunction,
      errorsByWallet,
      errorsByMessage: Object.entries(errorsByMessage)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      recentErrors: errorLogs.slice(0, 10)
    };
  },

  /**
   * Get performance metrics
   */
  getPerformanceMetrics: () => {
    const logs = logStore.getAllLogs();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentLogs = logs.filter(log => new Date(log.timestamp) > oneHourAgo);

    return {
      totalLogs: logs.length,
      recentLogs: recentLogs.length,
      logsPerHour: recentLogs.length,
      errorRate: (recentLogs.filter(log => log.level === 'ERROR').length / recentLogs.length) * 100,
      mostActiveFunctions: Object.entries(
        recentLogs.reduce((acc, log) => {
          const key = `${log.filename}:${log.function}`;
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      )
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
    };
  }
};

// Export persistentLogStorage for external use
export { persistentLogStorage };