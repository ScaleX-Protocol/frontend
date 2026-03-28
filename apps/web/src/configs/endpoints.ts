import { ChainTypeConfig } from '@/configs/chainType';

export interface EndpointConfig {
  api: string;
  indexer: string;
  websocket: string;
  agent: string;
}

const isLocalBackend = import.meta.env.VITE_BACKEND_ENV === 'local';

const defaultApi = ChainTypeConfig.isSolana
  ? 'https://solana-devnet-indexer.scalex.money'
  : 'https://base-sepolia-api.scalex.money';

const defaultIndexer = ChainTypeConfig.isSolana
  ? 'https://solana-devnet-indexer.scalex.money'
  : 'https://base-sepolia-indexer.scalex.money';

const defaultWs = ChainTypeConfig.isSolana
  ? 'wss://solana-devnet-ws.scalex.money'
  : 'wss://base-sepolia-websocket.scalex.money';

export const Endpoints: EndpointConfig = {
  api: isLocalBackend ? 'http://localhost:4000' : (import.meta.env.VITE_API_URL || defaultApi),
  indexer: isLocalBackend ? 'http://localhost:42070' : (import.meta.env.VITE_INDEXER_API_URL || defaultIndexer),
  websocket: isLocalBackend ? 'ws://localhost:8080' : (import.meta.env.VITE_WS_API_URL || defaultWs),
  agent: isLocalBackend ? 'http://localhost:3000' : (import.meta.env.VITE_AGENT_API_URL || 'https://base-sepolia-agent.scalex.money'),
};
