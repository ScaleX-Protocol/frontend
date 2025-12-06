'use client';

import React, { useState, useEffect } from 'react';
import { logStore, logQuery, logAnalysis, persistentLogStorage } from '@/utils/logQuery';
import { LogEntry, LogQuery as LogQueryType } from '@/utils/logQuery';
import LogDashboard from '@/components/LogDashboard';

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [storageStats, setStorageStats] = useState<any>(null);
  const [query, setQuery] = useState<LogQueryType>({});
  const [activeView, setActiveView] = useState<'table' | 'dashboard' | 'analytics'>('table');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
    loadStats();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, query]);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const allLogs = await persistentLogStorage.getLogs();
      setLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
    } catch (error) {
      console.error('Failed to load logs:', error);
      // Fallback to in-memory logs
      setLogs(logStore.getAllLogs());
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const logStats = logStore.getStats();
      const performance = logAnalysis.getPerformanceMetrics();
      const storage = await persistentLogStorage.getStorageStats();

      setStats({ ...logStats, ...performance });
      setStorageStats(storage);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (query.level) {
      filtered = filtered.filter(log => log.level.toLowerCase() === query.level?.toLowerCase());
    }

    if (query.walletAddress) {
      const walletLower = query.walletAddress.toLowerCase();
      filtered = filtered.filter(log =>
        (log.wallet.userAddress && log.wallet.userAddress.toLowerCase().includes(walletLower)) ||
        (log.wallet.embeddedWalletAddress && log.wallet.embeddedWalletAddress.toLowerCase().includes(walletLower))
      );
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower))
      );
    }

    if (query.startTime) {
      const startTime = new Date(query.startTime);
      filtered = filtered.filter(log => new Date(log.timestamp) >= startTime);
    }

    if (query.endTime) {
      const endTime = new Date(query.endTime);
      filtered = filtered.filter(log => new Date(log.timestamp) <= endTime);
    }

    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    setFilteredLogs(filtered);
  };

  const handleExport = async (format: 'json' | 'csv' | 'txt') => {
    try {
      const blob = await persistentLogStorage.exportLogsWithMetadata();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scalex-logs-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const result = await persistentLogStorage.importLogsFromFile(file);
      alert(`Imported ${result.imported} logs. Errors: ${result.errors.join(', ')}`);
      await loadLogs();
      await loadStats();
    } catch (error) {
      console.error('Failed to import logs:', error);
      alert('Failed to import logs. Please check the file format.');
    }
  };

  const clearAllLogs = async () => {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      try {
        await logStore.clear();
        setLogs([]);
        setFilteredLogs([]);
        setStats(null);
        alert('All logs have been cleared.');
      } catch (error) {
        console.error('Failed to clear logs:', error);
        alert('Failed to clear logs.');
      }
    }
  };

  const refreshLogs = () => {
    loadLogs();
    loadStats();
  };

  if (isLoading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading logs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Logs Explorer</h1>
              <p className="text-sm text-gray-500 mt-1">
                Total: {logs.length} logs | Filtered: {filteredLogs.length} results
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={refreshLogs}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                🔄 Refresh
              </button>
              <button
                onClick={() => setActiveView('dashboard')}
                className={`px-4 py-2 rounded ${
                  activeView === 'dashboard'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📊 Dashboard
              </button>
              <button
                onClick={() => setActiveView('analytics')}
                className={`px-4 py-2 rounded ${
                  activeView === 'analytics'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📈 Analytics
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Log Level</label>
              <select
                value={query.level || ''}
                onChange={(e) => setQuery({ ...query, level: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Levels</option>
                <option value="ERROR">ERROR</option>
                <option value="WARN">WARN</option>
                <option value="INFO">INFO</option>
                <option value="DEBUG">DEBUG</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Address</label>
              <input
                type="text"
                placeholder="0x1234...5678"
                value={query.walletAddress || ''}
                onChange={(e) => setQuery({ ...query, walletAddress: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search in messages..."
                value={query.search || ''}
                onChange={(e) => setQuery({ ...query, search: e.target.value || undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limit</label>
              <input
                type="number"
                placeholder="100"
                value={query.limit || ''}
                onChange={(e) => setQuery({ ...query, limit: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            <button
              onClick={() => setQuery({})}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Clear Filters
            </button>
            <button
              onClick={() => setQuery({ level: 'ERROR' })}
              className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
              Show Errors Only
            </button>
            <button
              onClick={() => setQuery({ search: 'transaction' })}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              Transactions
            </button>
            <button
              onClick={() => setQuery({ search: 'deposit' })}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              Deposits
            </button>
            <button
              onClick={() => setQuery({ level: 'ERROR', limit: 50 })}
              className="px-3 py-1 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
            >
              Recent Errors (50)
            </button>
          </div>
        </div>
      </div>

      {/* Storage Stats */}
      {storageStats && (
        <div className="bg-blue-50 border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex flex-wrap gap-6 text-sm">
              <span>📁 Storage: {(storageStats.localStorageUsed / 1024).toFixed(1)}KB used</span>
              <span>📊 Total Logs: {storageStats.totalLogs}</span>
              {storageStats.oldestLog && <span>🕐 From: {new Date(storageStats.oldestLog).toLocaleDateString()}</span>}
              {storageStats.newestLog && <span>🕑 To: {new Date(storageStats.newestLog).toLocaleDateString()}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeView === 'table' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Level
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wallet
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Function
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                          log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                          log.level === 'INFO' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-500">
                        {log.wallet.userAddress ?
                          `${log.wallet.userAddress.substring(0, 6)}...${log.wallet.userAddress.slice(-4)}` :
                          'NO_WALLET'
                        }
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-md truncate">
                        {log.message}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.function}()
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.service}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredLogs.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-lg font-medium">No logs found</div>
                  <div className="text-sm mt-1">Try adjusting your filters or check back later</div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeView === 'dashboard' && (
          <LogDashboard
            isOpen={true}
            onClose={() => setActiveView('table')}
          />
        )}

        {activeView === 'analytics' && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Overview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Logs:</span>
                  <span className="font-medium">{stats.totalLogs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent (1h):</span>
                  <span className="font-medium">{stats.recentLogs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Error Rate:</span>
                  <span className="font-medium text-red-600">{stats.errorRate.toFixed(2)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Logs/Hour:</span>
                  <span className="font-medium">{stats.logsPerHour}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">By Level</h3>
              <div className="space-y-2">
                {Object.entries(stats.byLevel || {}).map(([level, count]) => (
                  <div key={level} className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      level === 'ERROR' ? 'bg-red-100 text-red-800' :
                      level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                      level === 'INFO' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {level}
                    </span>
                    <span className="font-medium">{String(count)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleExport('json')}
                  className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  📥 Export Logs
                </button>
                <label className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 cursor-pointer text-center block">
                  📤 Import Logs
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                </label>
                <button
                  onClick={clearAllLogs}
                  className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  🗑️ Clear All Logs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}