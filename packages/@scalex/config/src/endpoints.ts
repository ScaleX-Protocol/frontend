export interface EndpointConfig {
  apiUrl: string;
  indexerUrl: string;
  wsUrl: string;
}

export const ENDPOINTS: EndpointConfig = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL || import.meta.env?.VITE_API_URL || 'https://base-sepolia-api.scalex.money',
  indexerUrl: process.env.EXPO_PUBLIC_INDEXER_URL || import.meta.env?.VITE_INDEXER_URL || 'https://base-sepolia-api.scalex.money',
  wsUrl: process.env.EXPO_PUBLIC_WS_URL || import.meta.env?.VITE_WS_URL || 'wss://base-sepolia-websocket.scalex.money',
};
