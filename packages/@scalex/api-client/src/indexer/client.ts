/**
 * Indexer API Client
 * Platform-agnostic HTTP client for the indexer service
 */

export interface IndexerClientConfig {
  baseUrl: string;
}

export class IndexerClient {
  private baseUrl: string;

  constructor(config: IndexerClientConfig) {
    this.baseUrl = config.baseUrl;
  }

  /**
   * Generic fetch function with error handling
   */
  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((error as any).error || `HTTP error! status: ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      console.error(`Indexer API error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    return this.fetch<T>(url.pathname + url.search);
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.fetch<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

/**
 * Legacy fetchIndexerAPI function for backward compatibility
 * Requires baseUrl to be passed
 */
export async function fetchIndexerAPIWithBaseUrl<T>(
  baseUrl: string,
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const client = new IndexerClient({ baseUrl });
  return client.fetch<T>(`/api${endpoint}`, options);
}

// Global instance for convenience
let globalIndexerClient: IndexerClient | null = null;

/**
 * Initialize the global indexer client with baseUrl
 * Call this once in your app initialization
 */
export function initializeIndexerClient(baseUrl: string) {
  globalIndexerClient = new IndexerClient({ baseUrl });
}

/**
 * Convenience function that uses the global client
 * Must call initializeIndexerClient first!
 */
export async function fetchIndexerAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!globalIndexerClient) {
    throw new Error('IndexerClient not initialized. Call initializeIndexerClient(baseUrl) first.');
  }
  return globalIndexerClient.fetch<T>(`/api${endpoint}`, options);
}
