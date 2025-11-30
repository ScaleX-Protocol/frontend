export interface EndpointConfig {
  api: string;
  indexer: string;
  websocket: string;
}

const isLocalBackend = process.env.NEXT_PUBLIC_BACKEND_ENV === 'local';

export const Endpoints: EndpointConfig = {
  api: isLocalBackend ? 'http://localhost:3000/api' : 'https://base-sepolia-api.scalex.money/api',
  indexer: isLocalBackend ? 'http://localhost:3000/indexer' : 'https://base-sepolia-indexer.scalex.money/api',
  websocket: isLocalBackend ? 'ws://localhost:8080' : 'wss://base-sepolia-websocket.scalex.money',
};
