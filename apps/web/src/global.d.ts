import type { Buffer } from 'buffer';
import { TradingViewWidget } from './features/trade/types/chart.types';

declare global {
  interface Window {
    Buffer: typeof Buffer;
    TradingView: {
      widget: new (config: unknown) => TradingViewWidget;
    };
  }

  interface ImportMetaEnv {
    // Built-in Vite environment variables
    readonly MODE: string;
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly SSR: boolean;

    // Privy and Authentication
    readonly VITE_PRIVY_APP_ID: string;
    readonly VITE_ONCHAINKIT_API_KEY?: string;

    // Backend Environment
    readonly VITE_BACKEND_ENV: string;

    // API Configuration
    readonly VITE_API_URL: string;
    readonly VITE_INDEXER_API_URL: string;
    readonly VITE_WS_API_URL: string;
    readonly VITE_AGENT_API_URL?: string;
    readonly VITE_AGENT_SERVICE_URL_OVERRIDE?: string;

    // Application Configuration
    readonly VITE_BASE_URL: string;
    readonly VITE_APP_NAME: string;
    readonly VITE_APP_ENV: string;
    readonly VITE_APP_DESCRIPTION: string;
    readonly VITE_DOMAIN: string;

    // Chain Configuration
    readonly VITE_CHAIN_TYPE?: 'evm' | 'solana';
    readonly VITE_CHAIN_NAME: string;
    readonly VITE_CHAIN_ID: string;
    readonly VITE_RPC_URL: string;
    readonly VITE_WS_URL: string;
    readonly VITE_BLOCK_EXPLORER_URL: string;

    // Solana Configuration (active when VITE_CHAIN_TYPE=solana)
    readonly VITE_SOLANA_CLUSTER?: 'mainnet' | 'devnet' | 'testnet';
    readonly VITE_SOLANA_CHAIN_ID?: string;
    readonly VITE_SOLANA_RPC_URL?: string;
    readonly VITE_SOLANA_WS_URL?: string;
    readonly VITE_SOLANA_EXPLORER_URL?: string;
    readonly VITE_SOLANA_FALLBACK_RPC_URLS?: string;
    readonly VITE_PRIVY_SOLANA_RPC_URL?: string;
    readonly VITE_PRIVY_SOLANA_WS_URL?: string;

    // Program / Contract Addresses
    readonly VITE_SCALEX_PROGRAM_ID?: string;
    readonly VITE_TOKEN_PROGRAM_ID?: string;

    // Token Mints (Solana)
    readonly VITE_TOKEN_BTC_MINT?: string;
    readonly VITE_TOKEN_USDT_MINT?: string;
    readonly VITE_TOKEN_WETH_MINT?: string;

    // Market Addresses (Solana)
    readonly VITE_MARKET_BTC_USDT?: string;
    readonly VITE_MARKET_WETH_USDT?: string;

    // Lending Pool Addresses (Solana)
    readonly VITE_LENDING_POOL_BTC?: string;
    readonly VITE_LENDING_POOL_USDT?: string;
    readonly VITE_LENDING_POOL_WETH?: string;

    // Oracle Addresses (Solana)
    readonly VITE_ORACLE_BTC?: string;
    readonly VITE_ORACLE_USDT?: string;
    readonly VITE_ORACLE_WETH?: string;

    // Logging Configuration
    readonly VITE_ENABLE_LOGS_BUTTON: string;
    readonly VITE_LOGS_BUTTON_POSITION: string;
    readonly VITE_MAX_LOGS: string;
    readonly VITE_ENABLE_EXTERNAL_LOGGING: string;
    readonly VITE_LOGGING_ENDPOINT: string;
    readonly VITE_LOG_LEVEL: string;
    readonly VITE_LOGS_AUTO_REFRESH: string;
    readonly VITE_MAX_LOG_SIZE: string;
    readonly VITE_MAX_LOG_DATA_SIZE: string;
    readonly VITE_LOG_SAMPLING_RATE: string;

    // Legacy ScaleX Environment Variables (if still used)
    readonly VITE_SCALEX_LOG_LEVEL?: string;
    readonly VITE_SCALEX_LOGGER_NAME?: string;
    readonly VITE_SCALEX_APP_NAME?: string;
    readonly VITE_SCALEX_SENTRY_DSN?: string;
    readonly VITE_SCALEX_ENV?: string;
    readonly VITE_BASE_SEPOLIA_RPC_URL?: string;
    readonly VITE_MANTLE_SEPOLIA_RPC_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export { };
