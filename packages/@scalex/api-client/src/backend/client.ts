/**
 * Backend API Client
 * Platform-agnostic HTTP client for the backend service
 */

export interface BackendClientConfig {
  baseUrl: string;
}

export class BackendClient {
  private baseUrl: string;

  constructor(config: BackendClientConfig) {
    this.baseUrl = config.baseUrl;
  }

  /**
   * Generic fetch function with error handling
   */
  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    console.log('[Limit Issue] BackendClient.fetch', { baseUrl: this.baseUrl, endpoint, url });

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error((error as any).error || `HTTP error! status: ${response.status}`);
      }

      return response.json() as Promise<T>;
    } catch (error) {
      console.error(`Backend API error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${this.baseUrl}/api${endpoint}`);

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, String(value));
      });
    }

    const fullPath = url.pathname + url.search;
    const relativeEndpoint = fullPath.replace(`${this.baseUrl}/api`, '');

    return this.fetch<T>(relativeEndpoint);
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

// Global instance for convenience
let globalBackendClient: BackendClient | null = null;

/**
 * Initialize the global backend client with baseUrl
 * Call this once in your app initialization
 */
export function initializeBackendClient(baseUrl: string) {
  console.log('[Limit Issue] Initializing BackendClient with baseUrl:', baseUrl);
  globalBackendClient = new BackendClient({ baseUrl });
}

/**
 * Convenience function that uses the global client
 * Must call initializeBackendClient first!
 */
export async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  if (!globalBackendClient) {
    throw new Error('BackendClient not initialized. Call initializeBackendClient(baseUrl) first.');
  }
  return globalBackendClient.fetch<T>(endpoint, options);
}
