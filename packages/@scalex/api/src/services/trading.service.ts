import { IndexerClient } from '../client/indexer-client';
import type { DepthResponse, Trade, Ticker24hr, KlineData, Market } from '@scalex/types';

export const TradingService = {
  getOrderBook: (client: IndexerClient, symbol: string, limit = 20) => 
    client.fetch<DepthResponse>(`/depth?symbol=${symbol}&limit=${limit}`),

  getTrades: (client: IndexerClient, symbol: string, limit = 50) => 
    client.fetch<Trade[]>(`/trades?symbol=${symbol}&limit=${limit}`),

  getTicker24h: (client: IndexerClient, symbol: string) => 
    client.fetch<Ticker24hr>(`/ticker/24hr?symbol=${symbol}`),

  getKlines: (client: IndexerClient, symbol: string, interval: string, limit = 500) => 
    client.fetch<KlineData[]>(`/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`),

  getMarkets: (client: IndexerClient) => 
    client.fetch<Market[]>('/markets'),

};