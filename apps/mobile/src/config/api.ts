import { initializeIndexerClient, initializeBackendClient } from '@scalex/api-client';

// API Endpoints
const ENDPOINTS = {
  indexer: 'https://base-sepolia-api.scalex.money',
  api: 'https://base-sepolia-api.scalex.money',
  websocket: 'wss://base-sepolia-websocket.scalex.money',
};

// Initialize API clients
export function initializeApiClients() {
  initializeIndexerClient(ENDPOINTS.indexer);
  initializeBackendClient(ENDPOINTS.api);
}

export { ENDPOINTS };
