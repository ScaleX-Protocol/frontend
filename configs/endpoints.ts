export interface EndpointConfig {
    api: string;
    indexer: string;
}

export const Endpoints: EndpointConfig = {
    api: 'https://base-sepolia-api.scalex.money/api',
    indexer: 'https://base-sepolia-indexer.scalex.money/api'
}