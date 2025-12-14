/**
 * Logging configuration
 * Controls logging behavior throughout the application
 */

export const LOGGING_CONFIG = {
  // Enable/disable the floating logs button
  showFloatingLogsButton: import.meta.env.MODE === 'development' || import.meta.env.VITE_ENABLE_LOGS_BUTTON === 'true',

  // Floating button position: 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-center'
  floatingButtonPosition: (import.meta.env.VITE_LOGS_BUTTON_POSITION as any) || 'bottom-center',

  // Enable/disable persistent storage
  enablePersistentStorage: true,

  // Maximum number of logs to keep in memory
  maxInMemoryLogs: parseInt(import.meta.env.VITE_MAX_LOGS || '10000'),

  // Enable external logging service
  enableExternalLogging: import.meta.env.VITE_ENABLE_EXTERNAL_LOGGING === 'true',

  // External logging endpoint
  externalLoggingEndpoint: import.meta.env.VITE_LOGGING_ENDPOINT,

  // Log level threshold: 'DEBUG', 'INFO', 'WARN', 'ERROR'
  logLevelThreshold: import.meta.env.VITE_LOG_LEVEL || 'INFO',

  // Enable console output (in addition to stored logs)
  enableConsoleOutput: true,

  // Auto-refresh logs in floating viewer (milliseconds)
  autoRefreshInterval: parseInt(import.meta.env.VITE_LOGS_AUTO_REFRESH || '5000'),

  // Export formats to enable
  enabledExportFormats: ['json', 'csv', 'txt'],

  // Maximum log size before truncation
  maxLogMessageSize: parseInt(import.meta.env.VITE_MAX_LOG_SIZE || '10000'),

  // Maximum data size before truncation
  maxLogDataSize: parseInt(import.meta.env.VITE_MAX_LOG_DATA_SIZE || '5000'),
} as const;

// Development-only logging configurations
export const DEV_LOGGING_CONFIG = {
  // Enable detailed debug logging in development
  enableDebugLogging: true,

  // Show component render logging
  enableComponentLogging: false,

  // Show hook lifecycle logging
  enableHookLogging: false,

  // Log all state changes
  enableStateLogging: false,

  // Performance monitoring
  enablePerformanceLogging: true,

  // Log network requests
  enableNetworkLogging: true,
};

// Production-only logging configurations
export const PROD_LOGGING_CONFIG = {
  // Only log errors and warnings in production
  enableInfoLogging: false,
  enableDebugLogging: false,

  // Enable error reporting to external services
  enableErrorReporting: true,

  // Anonymize user data in production
  anonymizeUserData: false,

  // Sample logs to reduce volume (percentage of logs to keep)
  logSamplingRate: parseFloat(import.meta.env.VITE_LOG_SAMPLING_RATE || '1.0'),
} as const;