import { Endpoints } from "@/configs/endpoints";

const INDEXER_BASE_URL = Endpoints.indexer

// Generic fetch function with error handling
export async function fetchIndexer<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${INDEXER_BASE_URL}${endpoint}`, options);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}
