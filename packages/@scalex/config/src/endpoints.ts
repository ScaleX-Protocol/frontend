/**
 * @scalex/config – Endpoint Configuration Factory
 *
 * Single source of truth for API/WebSocket endpoint shapes.
 * No env reading — each app injects its own VITE_* or EXPO_PUBLIC_* values.
 */

export interface EndpointConfig {
  /** Backend REST API base URL (e.g. https://base-sepolia-api.scalex.money) */
  api: string;
  /** Indexer REST API base URL (e.g. https://base-sepolia-indexer.scalex.money) */
  indexer: string;
  /** WebSocket base URL (e.g. wss://base-sepolia-websocket.scalex.money) */
  websocket: string;
}

/**
 * Create an endpoint configuration.
 *
 * @example
 * // Web (VITE)
 * export const Endpoints = createEndpoints({
 *   apiUrl: import.meta.env.VITE_API_URL,
 *   indexerUrl: import.meta.env.VITE_INDEXER_API_URL,
 *   wsUrl: import.meta.env.VITE_WS_API_URL,
 * });
 *
 * @example
 * // Mobile (Expo)
 * export const Endpoints = createEndpoints({
 *   apiUrl: process.env.EXPO_PUBLIC_API_URL!,
 *   indexerUrl: process.env.EXPO_PUBLIC_INDEXER_URL!,
 *   wsUrl: process.env.EXPO_PUBLIC_WS_URL!,
 * });
 */
export const createEndpoints = (env: {
  apiUrl: string;
  indexerUrl: string;
  wsUrl: string;
}): EndpointConfig => ({
  api: env.apiUrl,
  indexer: env.indexerUrl,
  websocket: env.wsUrl,
});
