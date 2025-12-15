export interface EndpointConfig {
  api: string;
  indexer: string;
  websocket: string;
}

export interface ApiClientConfig {
  endpoints: EndpointConfig;
}

// Default configuration (can be overridden)
export const createEndpointConfig = (config?: Partial<EndpointConfig>): EndpointConfig => {
  return {
    api: config?.api || '',
    indexer: config?.indexer || '',
    websocket: config?.websocket || '',
  };
};
