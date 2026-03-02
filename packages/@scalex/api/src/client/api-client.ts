import { ENDPOINTS } from '@scalex/config';

export class APIClient {
  private baseUrl: string;

  constructor(baseUrl: string = ENDPOINTS.apiUrl) {
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

export const apiClient = new APIClient();
