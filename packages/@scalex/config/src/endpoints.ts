/**
 * @scalex/config – Endpoint Configuration
 * Single source of truth for API/WebSocket endpoint shapes.
 * getEndpoints(env) detects VITE_ or EXPO_PUBLIC_ prefixes from app-injected env.
 */

export interface EndpointConfig {
  apiUrl: string;
  indexerUrl: string;
  wsUrl: string;
  /** @deprecated Use apiUrl */
  api?: string;
  /** @deprecated Use indexerUrl */
  indexer?: string;
  /** @deprecated Use wsUrl */
  websocket?: string;
}

/** Env-like record: keys can be VITE_* or EXPO_PUBLIC_* (e.g. from import.meta.env or process.env) */
export type EnvLike = Record<string, string | undefined>;

const DEFAULT_ENDPOINTS: EndpointConfig = {
  apiUrl: 'https://solana-devnet-indexer.scalex.money',
  indexerUrl: 'https://solana-devnet-indexer.scalex.money',
  wsUrl: 'wss://solana-devnet-ws.scalex.money/ws',
};

/**
 * Resolve endpoint URLs from an env-like object.
 * Prefers VITE_* (Web) then EXPO_PUBLIC_* (Mobile). Uses defaults if not set.
 *
 * @example Web (Vite)
 * getEndpoints(import.meta.env as EnvLike)
 *
 * @example Mobile (Expo)
 * getEndpoints(process.env as EnvLike)
 */
export function getEndpoints(env: EnvLike): EndpointConfig {
  const apiUrl =
    env.VITE_API_URL ??
    env.EXPO_PUBLIC_API_URL ??
    env.VITE_INDEXER_API_URL ??
    env.EXPO_PUBLIC_INDEXER_URL ??
    DEFAULT_ENDPOINTS.apiUrl;

  const indexerUrl =
    env.VITE_INDEXER_API_URL ??
    env.EXPO_PUBLIC_INDEXER_URL ??
    env.VITE_INDEXER_URL ??
    env.EXPO_PUBLIC_INDEXER_API_URL ??
    apiUrl;

  const wsUrl =
    env.VITE_WS_API_URL ??
    env.EXPO_PUBLIC_WS_URL ??
    env.VITE_WS_URL ??
    env.EXPO_PUBLIC_WS_API_URL ??
    DEFAULT_ENDPOINTS.wsUrl;

  return {
    apiUrl,
    indexerUrl,
    wsUrl,
    api: apiUrl,
    indexer: indexerUrl,
    websocket: wsUrl,
  };
}

/**
 * Create an endpoint configuration explicitly (no env detection).
 * Returns both apiUrl/indexerUrl/wsUrl and legacy api/indexer/websocket.
 */
export function createEndpoints(config: {
  apiUrl: string;
  indexerUrl: string;
  wsUrl: string;
}): EndpointConfig {
  const { apiUrl, indexerUrl, wsUrl } = config;
  return {
    apiUrl,
    indexerUrl,
    wsUrl,
    api: apiUrl,
    indexer: indexerUrl,
    websocket: wsUrl,
  };
}

/** Static default endpoints. Prefer getEndpoints(env) or registerAppConfig + config.getEndpoints(). */
export const DefaultEndpoints: EndpointConfig = {
  ...DEFAULT_ENDPOINTS,
  api: DEFAULT_ENDPOINTS.apiUrl,
  indexer: DEFAULT_ENDPOINTS.indexerUrl,
  websocket: DEFAULT_ENDPOINTS.wsUrl,
};

// export const ENDPOINTS: EndpointConfig = {
//   apiUrl: 'https://solana-devnet-indexer.scalex.money',
//   indexerUrl: 'https://solana-devnet-indexer.scalex.money',
//   wsUrl: 'wss://solana-devnet-ws.scalex.money/ws',
// };
