'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { logStore, logAnalysis, LogQuery, LogEntry } from '@/utils/logQuery';

interface LogDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LogDashboard({ isOpen, onClose }: LogDashboardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [query, setQuery] = useState<LogQuery>({
    level: '',
    search: '',
    limit: 100
  });
  const [activeTab, setActiveTab] = useState<'logs' | 'stats' | 'query'>('logs');

  const refreshLogs = useCallback(() => {
    const filteredLogs = logStore.query(query);
    setLogs(filteredLogs);
  }, [query]);

  const refreshStats = useCallback(() => {
    const stats = logStore.getStats();
    const performance = logAnalysis.getPerformanceMetrics();
    setStats({ ...stats, ...performance });
  }, []);

  useEffect(() => {
    if (isOpen) {
      refreshLogs();
      refreshStats();
    }
  }, [isOpen, refreshLogs, refreshStats]);

  const handleExport = (format: 'json' | 'csv' | 'txt') => {
    const exportData = logStore.exportLogs(format, query);
    const blob = new Blob([exportData], {
      type: format === 'json' ? 'application/json' : 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearLogs = () => {
    if (confirm('Are you sure you want to clear all logs?')) {
      logStore.clear();
      setLogs([]);
      setStats(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Log Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-4 py-2 ${activeTab === 'logs' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Logs ({logs.length})
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 ${activeTab === 'stats' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('query')}
            className={`px-4 py-2 ${activeTab === 'query' ? 'border-b-2 border-blue-500' : ''}`}
          >
            Query Builder
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex flex-wrap gap-2">
            <select
              value={query.level}
              onChange={(e) => setQuery({ ...query, level: e.target.value })}
              className="px-3 py-1 border rounded"
            >
              <option value="">All Levels</option>
              <option value="ERROR">ERROR</option>
              <option value="WARN">WARN</option>
              <option value="INFO">INFO</option>
              <option value="DEBUG">DEBUG</option>
            </select>

            <input
              type="text"
              placeholder="Search logs..."
              value={query.search}
              onChange={(e) => setQuery({ ...query, search: e.target.value })}
              className="px-3 py-1 border rounded flex-1"
            />

            <input
              type="number"
              placeholder="Limit"
              value={query.limit}
              onChange={(e) => setQuery({ ...query, limit: parseInt(e.target.value) || undefined })}
              className="px-3 py-1 border rounded w-24"
            />

            <button
              onClick={refreshLogs}
              className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Refresh
            </button>

            <select
              onChange={(e) => handleExport(e.target.value as 'json' | 'csv' | 'txt')}
              className="px-3 py-1 border rounded"
              defaultValue=""
            >
              <option value="" disabled>Export</option>
              <option value="json">Export JSON</option>
              <option value="csv">Export CSV</option>
              <option value="txt">Export TXT</option>
            </select>

            <button
              onClick={clearLogs}
              className="px-4 py-1 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto" style={{ height: 'calc(90vh - 200px)' }}>
          {activeTab === 'logs' && (
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left">Time</th>
                      <th className="px-4 py-2 text-left">Level</th>
                      <th className="px-4 py-2 text-left">Wallet</th>
                      <th className="px-4 py-2 text-left">Message</th>
                      <th className="px-4 py-2 text-left">Function</th>
                      <th className="px-4 py-2 text-left">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-2 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            log.level === 'ERROR' ? 'bg-red-100 text-red-800' :
                            log.level === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                            log.level === 'INFO' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs">
                          {log.wallet.userAddress ?
                            `${log.wallet.userAddress.substring(0, 6)}...${log.wallet.userAddress.slice(-4)}` :
                            'NO_WALLET'
                          }
                        </td>
                        <td className="px-4 py-2 max-w-xs truncate">
                          {log.message}
                        </td>
                        <td className="px-4 py-2 text-xs">
                          {log.function}()
                        </td>
                        <td className="px-4 py-2">
                          <details className="cursor-pointer">
                            <summary className="text-blue-600">Details</summary>
                            <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {JSON.stringify(log.data, null, 2)}
                            </pre>
                          </details>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No logs found matching your criteria
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Overview</h3>
                  <div className="space-y-2 text-sm">
                    <div>Total Logs: {stats.totalLogs as React.ReactNode}</div>
                    <div>Recent (1h): {stats.recentLogs as React.ReactNode}</div>
                    <div>Error Rate: {(stats.errorRate as number).toFixed(2)}%</div>
                    <div>Logs/Hour: {stats.logsPerHour as React.ReactNode}</div>
                  </div>
                </div>

                <div className="bg-white p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">By Level</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(stats.byLevel as Record<string, unknown>).map(([level, count]) => (
                      <div key={level} className="flex justify-between">
                        <span>{level}:</span>
                        <span>{count as React.ReactNode}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">By Service</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(stats.byService as Record<string, unknown>).map(([service, count]) => (
                      <div key={service} className="flex justify-between">
                        <span>{service}:</span>
                        <span>{count as React.ReactNode}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 border rounded-lg lg:col-span-2">
                  <h3 className="font-semibold mb-2">Most Active Wallets</h3>
                  <div className="space-y-1 text-sm">
                    {(stats.mostActiveWallets as any[]).map((wallet: any, index: number) => (
                      <div key={index} className="flex justify-between">
                        <span className="font-mono">
                          {wallet.address.substring(0, 6)}...{wallet.address.slice(-4)}
                        </span>
                        <span>{wallet.count} actions</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-4 border rounded-lg lg:col-span-3">
                  <h3 className="font-semibold mb-2">Recent Errors</h3>
                  <div className="space-y-2 text-sm max-h-64 overflow-y-auto">
                    {(stats.recentErrors as any[]).map((error: any, index: number) => (
                      <div key={index} className="border-l-4 border-red-500 pl-3">
                        <div className="font-medium">{error.message}</div>
                        <div className="text-gray-600 text-xs">
                          {new Date(error.timestamp).toLocaleString()} - {error.function}()
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'query' && (
            <div className="p-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Queries */}
                <div className="bg-white p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">Quick Queries</h3>
                  <div className="space-y-2">
                    <button
                      onClick={() => setQuery({ walletAddress: '', limit: 50 })}
                      className="w-full text-left px-3 py-2 border rounded hover:bg-gray-50"
                    >
                      Recent Activity (Last 50)
                    </button>
                    <button
                      onClick={() => setQuery({ level: 'ERROR', limit: 20 })}
                      className="w-full text-left px-3 py-2 border rounded hover:bg-gray-50"
                    >
                      Recent Errors (Last 20)
                    </button>
                    <button
                      onClick={() => setQuery({ search: 'transaction', limit: 30 })}
                      className="w-full text-left px-3 py-2 border rounded hover:bg-gray-50"
                    >
                      Transaction Logs
                    </button>
                    <button
                      onClick={() => setQuery({ label: 'USER', limit: 50 })}
                      className="w-full text-left px-3 py-2 border rounded hover:bg-gray-50"
                    >
                      User Actions
                    </button>
                    <button
                      onClick={() => setQuery({ label: 'CONTRACT', limit: 30 })}
                      className="w-full text-left px-3 py-2 border rounded hover:bg-gray-50"
                    >
                      Contract Interactions
                    </button>
                  </div>
                </div>

                {/* User Activity */}
                <div className="bg-white p-4 border rounded-lg">
                  <h3 className="font-semibold mb-4">User Activity Analysis</h3>
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter wallet address..."
                      className="w-full px-3 py-2 border rounded"
                      onChange={(e) => {
                        if (e.target.value) {
                          setQuery({ walletAddress: e.target.value, limit: 100 });
                        }
                      }}
                    />
                    <div className="text-sm text-gray-600">
                      Enter a wallet address to analyze that user&apos;s activity pattern,
                      errors, and transaction history.
                    </div>
                  </div>
                </div>

                {/* Time Range */}
                <div className="bg-white p-4 border rounded-lg lg:col-span-2">
                  <h3 className="font-semibold mb-4">Time Range Analysis</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border rounded"
                        onChange={(e) => {
                          if (e.target.value) {
                            setQuery({
                              ...query,
                              startTime: new Date(e.target.value)
                            });
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Time</label>
                      <input
                        type="datetime-local"
                        className="w-full px-3 py-2 border rounded"
                        onChange={(e) => {
                          if (e.target.value) {
                            setQuery({
                              ...query,
                              endTime: new Date(e.target.value)
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}