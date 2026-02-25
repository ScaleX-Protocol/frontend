import { DefaultEndpoints } from '@scalex/config';

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

export const defaultClient = new IndexerClient();
