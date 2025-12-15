import { initializeIndexerClient, initializeBackendClient } from '@scalex/api-client';

// API Endpoints
const ENDPOINTS = {
  indexer: 'https://base-sepolia-indexer.scalex.money',
  api: 'https://api.scalex.money', // Replace with actual backend URL
  websocket: 'wss://base-sepolia-indexer.scalex.money',
};

// Initialize API clients
export function initializeApiClients() {
  initializeIndexerClient(ENDPOINTS.indexer);
  initializeBackendClient(ENDPOINTS.api);
}

export { ENDPOINTS };
