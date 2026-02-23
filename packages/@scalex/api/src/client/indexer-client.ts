/**
 * Indexer API client – uses config for base URL when available
 */

import { DefaultEndpoints } from '@scalex/config';
/*
export class IndexerClient {
  private baseUrl: string;

  constructor(baseUrl: string = DefaultEndpoints.indexerUrl) {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, options);

    if (!response.ok) {
      throw new Error(`ScaleX API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json() as Promise<T>;
  }

  async get<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${this.baseUrl}/api${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
    }
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`ScaleX API Error: ${res.status}`);
    return res.json() as Promise<T>;
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}/api${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined,
    });
    if (!res.ok) throw new Error(`ScaleX API Error: ${res.status}`);
    return res.json() as Promise<T>;
  }
}

export const defaultIndexerClient = new IndexerClient();
*/

export class IndexerClient {
  private baseUrl: string;

  constructor(baseUrl: string = DefaultEndpoints.indexerUrl) {
    this.baseUrl = baseUrl;
  }

  async fetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.baseUrl}/api${endpoint}`, options);
    
    if (!response.ok) {
      throw new Error(`ScaleX API Error: ${response.status} - ${response.statusText}`);
    }
    
    return response.json() as Promise<T>;
  }
}

// Instance default untuk memudahkan penggunaan
export const defaultClient = new IndexerClient();
