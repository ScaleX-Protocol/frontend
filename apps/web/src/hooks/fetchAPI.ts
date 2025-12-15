import { Endpoints } from "@/configs/endpoints";
import { logger } from "@/utils/prodLogger";

const log = logger.withContext({ module: '[Limit Issue] fetchAPI' });
const API_BASE_URL = Endpoints.api;

log.info('fetchAPI initialized', { API_BASE_URL, fullEndpoints: Endpoints });

// Generic fetch function with error handling
export async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const fullUrl = `${API_BASE_URL}/api${endpoint}`;
  log.info('fetchAPI called', { endpoint, fullUrl, API_BASE_URL });

  const response = await fetch(fullUrl, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
