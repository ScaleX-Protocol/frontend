'use client';

import { LogEntry, LogQuery as LogQueryType, logStore, persistentLogStorage } from '@/utils/logQuery';
import { Activity, AlertCircle, AlertTriangle, ChevronDown, ChevronUp, Download, Info, Logs, RefreshCw, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import WalletMonitorButton from './WalletMonitorButton';
import { logger } from '@/utils/prodLogger';

interface FloatingLogsButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left' | 'bottom-center';
}

export default function FloatingLogsButton({ position = 'bottom-center' }: FloatingLogsButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<LogEntry[]>([]);
  const [query, setQuery] = useState<LogQueryType>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [isMinimized, setIsMinimized] = useState(false);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const log = logger.withContext({ component: 'FloatingLogsButton' });

  
  // Custom styles for the panel when centered
  const getPanelStyle = () => {
    if (position === 'bottom-center') {
      return {
        position: 'fixed' as const,
        bottom: '6rem',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        width: '600px'
      };
    }
    return {};
  };

  // Position classes
  const positionClasses = {
    'bottom-right': 'bottom-8 right-8',
    'bottom-left': 'bottom-8 left-8',
    'top-right': 'top-8 right-8',
    'top-left': 'top-8 left-8',
    'bottom-center': 'bottom-8 left-1/2 transform -translate-x-1/2'
  };

  const loadLogs = useCallback(async () => {
    try {
      const allLogs = await persistentLogStorage.getLogs();
      setLogs(allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

      // Calculate basic stats
      const errorCount = allLogs.filter(log => log.level === 'ERROR').length;
      const warnCount = allLogs.filter(log => log.level === 'WARN').length;
      setStats({ total: allLogs.length, errors: errorCount, warnings: warnCount });
    } catch (error) {
      log.error('Failed to load logs', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [log]);

  // Load logs when panel opens
  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen, loadLogs]);

  // Apply filters
  useEffect(() => {
    let filtered = [...logs];

    // Apply query filters
    if (query.level) {
      filtered = filtered.filter(log => log.level.toLowerCase() === query.level!.toLowerCase());
    }

    if (query.walletAddress) {
      const walletLower = query.walletAddress.toLowerCase();
      filtered = filtered.filter(log =>
        (log.wallet.userAddress && log.wallet.userAddress.toLowerCase().includes(walletLower)) ||
        (log.wallet.embeddedWalletAddress && log.wallet.embeddedWalletAddress.toLowerCase().includes(walletLower))
      );
    }

    if (query.label) {
      filtered = filtered.filter(log => log.label.toLowerCase().includes(query.label!.toLowerCase()));
    }

    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(searchLower) ||
        (log.data && JSON.stringify(log.data).toLowerCase().includes(searchLower)) ||
        log.function.toLowerCase().includes(searchLower)
      );
    }

    // Apply limit
    if (query.limit) {
      filtered = filtered.slice(0, query.limit);
    }

    setFilteredLogs(filtered);
  }, [logs, query, searchTerm]);

  const clearFilters = () => {
    setQuery({});
    setSearchTerm('');
  };

  const exportLogs = (format: 'json' | 'csv' = 'json') => {
    try {
      const exportData = format === 'json'
        ? JSON.stringify(filteredLogs, null, 2)
        : filteredLogs.map(log =>
            `${log.timestamp},${log.level},${log.label},${log.wallet.userAddress || 'NO_WALLET'},"${log.message}"`
          ).join('\n');

      const blob = new Blob([exportData], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs-${new Date().toISOString().split('T')[0]}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      log.error('Failed to export logs', {
        error: error instanceof Error ? error.message : 'Unknown error',
        exportFormat: format,
        logsCount: filteredLogs.length
      });
    }
  };

  const clearAllLogs = async () => {
    if (confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      try {
        await logStore.clear();
        setLogs([]);
        setFilteredLogs([]);
        setStats({ total: 0, errors: 0, warnings: 0 });
      } catch (error) {
        log.error('Failed to clear logs', {
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'WARN': return <AlertTriangle className="w-4 h-4 text-gray-500" />;
      case 'INFO': return <Info className="w-4 h-4 text-gray-600" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'text-red-600 bg-red-50 border-red-200';
      case 'WARN': return 'text-gray-700 bg-gray-100 border-gray-300';
      case 'INFO': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <div className={`fixed bottom-4 z-30 flex items-center transition-all duration-300 ${
        isCollapsed ? 'right-4' : 'w-full left-0 justify-center'
      }`}>
        {/* Dev Tools Container */}
        <div className="bg-black/10 backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl p-2 flex gap-2 items-center">
          {/* Collapse/Expand Toggle Button - Always visible */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="bg-transparent hover:bg-black/30 text-white px-3 py-3 rounded-2xl transition-all duration-200 hover:scale-105"
            title={isCollapsed ? "Expand Dev Tools" : "Collapse Dev Tools"}
          >
            {isCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>

          {/* Dev Tools Buttons - Collapsible */}
          {!isCollapsed && (
            <>
              {!isOpen && (
                <button
                  onClick={() => setIsOpen(true)}
                  className="bg-transparent hover:bg-black/30 text-white px-6 py-3 rounded-2xl transition-all duration-200 hover:scale-105 group flex items-center space-x-2"
                  title="Open Logs Viewer"
                >
                  <Logs className="w-5 h-5" />
                  <span className="font-medium text-sm">Logs</span>
                  {stats?.total && typeof stats.total === 'number' && stats.total > 0 ? (
                    <span className="bg-white/20 px-2 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                      {String(stats.total)}
                    </span>
                  ) : null}
                  {stats && stats.errors && typeof stats.errors === 'number' && stats.errors > 0 ? (
                    <span className="absolute -top-2 -right-2 bg-red-500/90 backdrop-blur-sm text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                      {String(stats.errors)}
                    </span>
                  ) : null}
                </button>
              )}
              <WalletMonitorButton />
            </>
          )}
        </div>
      </div>

      {/* Logs Panel */}
      {isOpen && (
        <div className={`z-50 bg-white rounded-lg shadow-2xl border border-gray-300 transition-all duration-300 flex flex-col ${
          isMinimized ? 'w-16 h-16' : 'h-[600px] max-h-[80vh] w-[600px]'
        } ${position === 'bottom-center' ? '' : `fixed ${positionClasses[position]}`}`}
        style={getPanelStyle()}
      >
          {/* Header */}
          <div className="bg-black text-white px-4 py-3 rounded-t-lg flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Logs className="w-4 h-4" />
              {!isMinimized && (
                <>
                  <span className="font-medium">Logs Viewer</span>
                  {stats && (
                    <span className="text-xs bg-gray-800 px-2 py-1 rounded">
                      {String(stats.total)} total, {String(filteredLogs.length)} shown
                    </span>
                  )}
                </>
              )}
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 hover:bg-gray-700 rounded"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {!isMinimized && (
                <button
                  onClick={loadLogs}
                  className="p-1 hover:bg-gray-700 rounded"
                  title="Refresh"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-700 rounded"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Search and Filter Bar */}
              <div className="border-b border-gray-200 p-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Logs
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search messages, functions, data..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>

                <div className="flex gap-3 flex-wrap">
                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Log Level
                    </label>
                    <select
                      value={query.level || ''}
                      onChange={(e) => setQuery({ ...query, level: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                    >
                      <option value="">All Levels</option>
                      <option value="ERROR">ERROR</option>
                      <option value="WARN">WARN</option>
                      <option value="INFO">INFO</option>
                      <option value="DEBUG">DEBUG</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <select
                      value={query.label || ''}
                      onChange={(e) => setQuery({ ...query, label: e.target.value || undefined })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                    >
                      <option value="">All Labels</option>
                      <option value="user">User Actions</option>
                      <option value="trading">Trading</option>
                      <option value="deposit">Deposits</option>
                      <option value="contract">Contracts</option>
                      <option value="api">API Calls</option>
                      <option value="system">System</option>
                    </select>
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Limit
                    </label>
                    <input
                      type="number"
                      value={query.limit || ''}
                      onChange={(e) => setQuery({ ...query, limit: e.target.value ? parseInt(e.target.value) : undefined })}
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-900 bg-white"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Wallet Address
                    </label>
                    <input
                      type="text"
                      value={query.walletAddress || ''}
                      onChange={(e) => setQuery({ ...query, walletAddress: e.target.value || undefined })}
                      placeholder="0x1234...5678"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-mono text-gray-900 bg-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setQuery({ level: 'ERROR' })}
                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    Errors Only
                  </button>
                  <button
                    onClick={() => setQuery({ level: 'WARN' })}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    Warnings Only
                  </button>
                  <button
                    onClick={() => setSearchTerm('transaction')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    Transactions
                  </button>
                  <button
                    onClick={() => setSearchTerm('deposit')}
                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm"
                  >
                    Deposits
                  </button>
                  <button
                    onClick={clearFilters}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm ml-auto"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Logs Display */}
              <div className="flex-1 overflow-y-auto p-3 min-h-0">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Logs className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No logs found</p>
                    <p className="text-sm mt-1">Try adjusting your filters or search</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredLogs.map((log, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border text-sm ${getLevelColor(log.level)} hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-start space-x-2">
                          {getLevelIcon(log.level)}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium text-xs">{log.level}</span>
                              <span className="text-xs opacity-75">
                                {new Date(log.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-gray-800 mb-2 break-words">{log.message}</p>
                            <div className="flex items-center space-x-2 text-xs opacity-75">
                              <span>{log.function}()</span>
                              <span>•</span>
                              <span>{log.label}</span>
                              {log.wallet.userAddress && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">
                                    {log.wallet.userAddress.substring(0, 6)}...{log.wallet.userAddress.slice(-4)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(query.limit && filteredLogs.length === query.limit) && (
                      <div className="text-center py-3 text-sm text-gray-500">
                        Showing {query.limit} logs (use limit filter to see more)
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 px-4 py-2 flex justify-between items-center">
                <div className="flex space-x-2">
                  <button
                    onClick={() => exportLogs('json')}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Export as JSON"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={clearAllLogs}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Clear all logs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}