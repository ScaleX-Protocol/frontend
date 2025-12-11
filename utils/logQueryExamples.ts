/**
 * Examples and utility functions for querying logs
 * Import these in your components to easily query logs
 */

import { useState, useEffect } from 'react';
import { logQuery, logAnalysis, logStore } from './logQuery';

/**
 * Common query examples - copy/paste into browser console or components
 */

// Example 1: Get all logs for a specific user
export const getUserLogs = (walletAddress: string) => {
  return logQuery.byWallet(walletAddress, 100);
};

// Example 2: Get all errors from the last hour
export const getRecentErrors = () => {
  return logQuery.recent(60); // last 60 minutes
};

// Example 3: Get all transaction logs for a user
export const getUserTransactions = (walletAddress: string) => {
  return logQuery.transactions(walletAddress, 50);
};

// Example 4: Get all contract interaction logs
export const getContractLogs = () => {
  return logQuery.contractCalls();
};

// Example 5: Search for specific error patterns
export const searchErrors = (searchTerm: string) => {
  return logQuery.search(searchTerm, { level: 'ERROR' });
};

/**
 * Advanced query examples for debugging
 */

// Get all failed transactions
export const getFailedTransactions = () => {
  return logQuery.search('failed transaction', { level: 'ERROR' });
};

// Get all deposit-related activities
export const getDepositActivities = () => {
  return logQuery.search('deposit');
};

// Get all approval-related activities
export const getApprovalActivities = () => {
  return logQuery.search('approval');
};

// Get logs for specific function
export const getFunctionLogs = (functionName: string, filename?: string) => {
  return logQuery.byFunction(functionName, filename);
};

/**
 * Real-time monitoring examples
 */

// Monitor for new errors
export const monitorErrors = (callback: (errorLogs: any[]) => void) => {
  const checkInterval = setInterval(() => {
    const recentErrors = logQuery.recent(5); // last 5 minutes
    const errorLogs = recentErrors.filter(log => log.level === 'ERROR');

    if (errorLogs.length > 0) {
      callback(errorLogs);
    }
  }, 30000); // check every 30 seconds

  return () => clearInterval(checkInterval);
};

// Monitor user activity
export const monitorUserActivity = (walletAddress: string, callback: (activity: any) => void) => {
  const checkInterval = setInterval(() => {
    const userActivity = logAnalysis.getUserActivity(walletAddress);
    callback(userActivity);
  }, 10000); // check every 10 seconds

  return () => clearInterval(checkInterval);
};

/**
 * Data analysis functions
 */

// Get error patterns over time
export const getErrorPatterns = () => {
  const errorAnalysis = logAnalysis.getErrorAnalysis(24); // last 24 hours
  return {
    totalErrors: errorAnalysis.totalErrors,
    commonErrors: errorAnalysis.errorsByMessage,
    errorLocations: errorAnalysis.errorsByFunction,
    affectedUsers: Object.keys(errorAnalysis.errorsByWallet).length
  };
};

// Get user engagement metrics
export const getUserEngagementMetrics = () => {
  const stats = logStore.getStats();
  return {
    totalUsers: Object.keys(stats.byWallet).length,
    activeUsers: Object.keys(stats.byWallet).filter(address =>
      stats.byWallet[address] > 10 // more than 10 actions
    ).length,
    avgActionsPerUser: stats.totalLogs / Object.keys(stats.byWallet).length,
    mostActiveUsers: stats.mostActiveWallets.slice(0, 5)
  };
};

// Get transaction success rate
export const getTransactionMetrics = () => {
  const transactionLogs = logQuery.transactions();
  const successLogs = transactionLogs.filter(log =>
    log.message.includes('successful') || log.message.includes('completed')
  );
  const errorLogs = transactionLogs.filter(log =>
    log.level === 'ERROR' || log.message.includes('failed')
  );

  return {
    totalTransactions: transactionLogs.length,
    successfulTransactions: successLogs.length,
    failedTransactions: errorLogs.length,
    successRate: transactionLogs.length > 0
      ? (successLogs.length / transactionLogs.length) * 100
      : 0
  };
};

/**
 * Export utilities
 */

// Export all logs for a specific user
export const exportUserLogs = (walletAddress: string, format: 'json' | 'csv' = 'json') => {
  const userLogs = logQuery.byWallet(walletAddress);
  const exportData = logStore.exportLogs(format, { walletAddress });

  const blob = new Blob([exportData], {
    type: format === 'json' ? 'application/json' : 'text/csv'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user-logs-${walletAddress}-${new Date().toISOString().split('T')[0]}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
};

// Export all error logs
export const exportErrorLogs = (format: 'json' | 'csv' = 'json') => {
  const errorLogs = logQuery.errors();
  const exportData = logStore.exportLogs(format, { level: 'ERROR' });

  const blob = new Blob([exportData], {
    type: format === 'json' ? 'application/json' : 'text/csv'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `error-logs-${new Date().toISOString().split('T')[0]}.${format}`;
  a.click();
  URL.revokeObjectURL(url);
};

/**
 * Console commands for developers
 * Paste these in browser console for quick debugging
 */

export const CONSOLE_COMMANDS = `
// === LOG QUERYING CONSOLE COMMANDS ===

// Get all logs for current user (replace with actual wallet address)
logQuery.byWallet('0x1234567890123456789012345678901234567890', 50)

// Get recent errors
logQuery.errors(20)

// Get all transaction logs
logQuery.transactions()

// Search for specific text
logQuery.search('deposit', { limit: 10 })

// Get logs from last hour
logQuery.recent(60)

// Get contract interaction logs
logQuery.contractCalls()

// Get user activity analysis
logAnalysis.getUserActivity('0x1234567890123456789012345678901234567890')

// Get error analysis for last 24 hours
logAnalysis.getErrorAnalysis(24)

// Get performance metrics
logAnalysis.getPerformanceMetrics()

// Export all logs as JSON
logStore.exportLogs('json')

// Export logs for specific user
logStore.exportLogs('csv', { walletAddress: '0x1234567890123456789012345678901234567890' })

// Get statistics
logStore.getStats()

// Clear all logs (use with caution!)
logStore.clear()

// Advanced query example
logStore.query({
  level: 'ERROR',
  startTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // last 24 hours
  search: 'transaction',
  limit: 50
})
`;

/**
 * Hook for real-time log monitoring in React components
 */
export const useLogMonitor = (walletAddress?: string) => {
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const logs = walletAddress
        ? logQuery.byWallet(walletAddress, 10)
        : logQuery.recent(5);

      setRecentLogs(logs);

      const errors = logs.filter(log => log.level === 'ERROR');
      setErrorCount(errors.length);
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [walletAddress]);

  return { recentLogs, errorCount };
};

/**
 * Performance monitoring utilities
 */

// Track slow operations
export const trackSlowOperations = () => {
  const logs = logQuery.search('slow', { limit: 20 });
  return logs.map(log => ({
    timestamp: log.timestamp,
    operation: log.data?.operation || log.message,
    duration: log.data?.duration,
    wallet: log.wallet.userAddress
  }));
};

// Track failed operations
export const trackFailedOperations = () => {
  const logs = logQuery.search('failed', { level: 'ERROR' });
  return logs.map(log => ({
    timestamp: log.timestamp,
    operation: log.data?.operation || log.message,
    error: log.data?.error,
    wallet: log.wallet.userAddress,
    function: log.function
  }));
};

/**
 * Integration examples
 */

// Example: Add to your existing components
export const addLoggingToComponent = () => {
  /*
  import { useLogger } from '@/hooks/useLogger';
  import { getUserLogs } from '@/utils/logQueryExamples';

  function YourComponent() {
    const logger = useLogger();

    const handleUserAction = () => {
      logger.logUserAction('custom_action', { details: '...' });

      // Query user's past actions
      const userActions = getUserLogs(logger.walletContext.userAddress);
      logger.info('User has performed', { actionCount: userActions.length });
    };

    return <button onClick={handleUserAction}>Action</button>;
  }
  */
};