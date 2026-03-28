import { Endpoints } from '@/configs/endpoints';

const INDEXER_BASE_URL = Endpoints.indexer;

// Generic fetch function with error handling
// Note: endpoint should start with / (e.g., /depth, /trades)
export async function fetchIndexerAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Avoid double /api - check both base URL and endpoint
  const baseHasApi = INDEXER_BASE_URL.endsWith('/api');
  const endpointHasApi = endpoint.startsWith('/api');

  let fullUrl: string;
  if (baseHasApi && endpointHasApi) {
    // Both have /api - remove from endpoint
    fullUrl = `${INDEXER_BASE_URL}${endpoint.slice(4)}`;
  } else if (baseHasApi) {
    // Base has /api, endpoint doesn't - just append endpoint
    fullUrl = `${INDEXER_BASE_URL}${endpoint}`;
  } else if (endpointHasApi) {
    // Endpoint has /api, base doesn't - use endpoint as is
    fullUrl = `${INDEXER_BASE_URL}${endpoint}`;
  } else {
    // Neither has /api - add it
    fullUrl = `${INDEXER_BASE_URL}/api${endpoint}`;
  }

  const response = await fetch(fullUrl, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
