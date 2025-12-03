/**
 * Test Configuration
 * Centralized configuration for all test scripts
 */

// Base URL for the application under test
// Can be overridden via environment variables
const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';

// API endpoint for direct API testing
const API_BASE_URL = process.env.TEST_API_URL || BASE_URL;

// Test environment configuration
const TEST_CONFIG = {
  // URLs
  BASE_URL,
  API_BASE_URL,

  // Common test paths
  PATHS: {
    HOME: '/',
    TRADE: '/trade',
    FAUCET: '/faucet',
    LENDING: '/lending',
  },

  // Test timeouts (in milliseconds)
  TIMEOUTS: {
    NAVIGATION: 30000,
    ELEMENT_LOAD: 10000,
    API_RESPONSE: 15000,
    MODAL_OPEN: 10000,
    AUTHENTICATION: 20000,
  },

  // Test address for API testing
  TEST_ADDRESS: process.env.TEST_ADDRESS || '0xc8E6F712902DCA8f50B10Dd7Eb3c89E5a2Ed9a2a',

  // Available trading symbols for testing
  TRADING_SYMBOLS: [
    'gsWETH/gsUSDC',
    // 'gsWBTC/gsUSDC', // Uncomment when available
  ],

  // Browser configuration
  BROWSER: {
    HEADLESS: process.env.TEST_HEADLESS !== 'false',
    SLOWMO: parseInt(process.env.TEST_SLOWMO || '0') || 0,
    VIEWPORT: {
      width: 1280,
      height: 720,
    },
  },

  // Request/response interceptors
  MONITOR: {
    API_REQUESTS: true,
    CONSOLE_LOGS: true,
    NETWORK_ERRORS: true,
  },

  // Environment-specific settings
  ENVIRONMENT: {
    CI: process.env.CI === 'true',
    DEVELOPMENT: process.env.NODE_ENV === 'development',
    STAGING: process.env.TEST_ENV === 'staging',
    PRODUCTION: process.env.TEST_ENV === 'production',
  },
};

// Export utility functions for common test operations
const TestUtils = {
  /**
   * Get full URL for a given path
   */
  getUrl: (path: string = '/') => {
    return `${TEST_CONFIG.BASE_URL}${path}`;
  },

  /**
   * Get API URL for a given endpoint
   */
  getApiUrl: (endpoint: string) => {
    return `${TEST_CONFIG.API_BASE_URL}${endpoint}`;
  },

  /**
   * Get timeout value with fallback
   */
  getTimeout: (timeoutType: keyof typeof TEST_CONFIG.TIMEOUTS, fallback: number = 5000) => {
    return TEST_CONFIG.TIMEOUTS[timeoutType] || fallback;
  },

  /**
   * Log test information with consistent formatting
   */
  log: (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      debug: '🔍',
    };

    console.log(`${icons[type] || icons.info} ${message}`);
  },
};

export {
  TEST_CONFIG,
  TestUtils,
};