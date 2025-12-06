/**
 * Logging configuration
 * Controls logging behavior throughout the application
 */

export const LOGGING_CONFIG = {
  // Enable/disable the floating logs button
  showFloatingLogsButton: process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_LOGS_BUTTON === 'true',

  // Floating button position: 'bottom-right', 'bottom-left', 'top-right', 'top-left', 'bottom-center'
  floatingButtonPosition: (process.env.NEXT_PUBLIC_LOGS_BUTTON_POSITION as any) || 'bottom-center',

  // Enable/disable persistent storage
  enablePersistentStorage: true,

  // Maximum number of logs to keep in memory
  maxInMemoryLogs: parseInt(process.env.NEXT_PUBLIC_MAX_LOGS || '10000'),

  // Enable external logging service
  enableExternalLogging: process.env.NEXT_PUBLIC_ENABLE_EXTERNAL_LOGGING === 'true',

  // External logging endpoint
  externalLoggingEndpoint: process.env.NEXT_PUBLIC_LOGGING_ENDPOINT,

  // Log level threshold: 'DEBUG', 'INFO', 'WARN', 'ERROR'
  logLevelThreshold: process.env.NEXT_PUBLIC_LOG_LEVEL || 'INFO',

  // Enable console output (in addition to stored logs)
  enableConsoleOutput: true,

  // Auto-refresh logs in floating viewer (milliseconds)
  autoRefreshInterval: parseInt(process.env.NEXT_PUBLIC_LOGS_AUTO_REFRESH || '5000'),

  // Export formats to enable
  enabledExportFormats: ['json', 'csv', 'txt'],

  // Maximum log size before truncation
  maxLogMessageSize: parseInt(process.env.NEXT_PUBLIC_MAX_LOG_SIZE || '10000'),

  // Maximum data size before truncation
  maxLogDataSize: parseInt(process.env.NEXT_PUBLIC_MAX_LOG_DATA_SIZE || '5000'),
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
  logSamplingRate: parseFloat(process.env.NEXT_PUBLIC_LOG_SAMPLING_RATE || '1.0'),
} as const;