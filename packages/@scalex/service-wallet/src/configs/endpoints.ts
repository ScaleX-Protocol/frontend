export interface EndpointConfig {
  api: string;
  indexer: string;
  websocket: string;
}

const isLocalBackend = (import.meta as any).env?.VITE_BACKEND_ENV === 'local';

export const Endpoints: EndpointConfig = {
  api: isLocalBackend ? 'http://localhost:4000' : ((import.meta as any).env?.VITE_API_URL || 'https://base-sepolia-api.scalex.money'),
  indexer: isLocalBackend ? 'http://localhost:42070' : ((import.meta as any).env?.VITE_INDEXER_API_URL || 'https://base-sepolia-indexer.scalex.money'),
  websocket: isLocalBackend ? 'ws://localhost:8080' : ((import.meta as any).env?.VITE_WS_API_URL || 'wss://base-sepolia-websocket.scalex.money'),
};
