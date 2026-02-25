import { Endpoints } from "@/configs/endpoints";

const API_BASE_URL = Endpoints.api;

// Generic fetch function for the agent/API service
export async function fetchAgentAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  // Avoid double /api - check both base URL and endpoint
  const baseHasApi = API_BASE_URL.endsWith('/api');
  const endpointHasApi = endpoint.startsWith('/api');

  let fullUrl: string;
  if (baseHasApi && endpointHasApi) {
    fullUrl = `${API_BASE_URL}${endpoint.slice(4)}`;
  } else if (baseHasApi) {
    fullUrl = `${API_BASE_URL}${endpoint}`;
  } else if (endpointHasApi) {
    fullUrl = `${API_BASE_URL}${endpoint}`;
  } else {
    fullUrl = `${API_BASE_URL}/api${endpoint}`;
  }

  const response = await fetch(fullUrl, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
