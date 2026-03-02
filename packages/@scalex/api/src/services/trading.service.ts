import { APIClient } from '../client/api-client';
import type { DepthResponse, Trade, Ticker24hr, KlineData, Market, Order, TradingPair, AccountInfo } from '@scalex/types';

export const TradingService = {
  getMarkets: (client: APIClient) => 
    client.fetch<Market[]>('/markets'),
  
  getPairs: (client: APIClient) => 
    client.fetch<TradingPair[]>('/pairs'),

  getDepth: (client: APIClient, symbol: string, limit = 20) => 
    client.fetch<DepthResponse>(`/depth?symbol=${symbol}&limit=${limit}`),

  getTrades: (client: APIClient, symbol: string, limit = 50) => 
    client.fetch<Trade[]>(`/trades?symbol=${symbol}&limit=${limit}`),

  getTicker24hr: (client: APIClient, symbol: string) => 
    client.fetch<Ticker24hr>(`/ticker/24hr?symbol=${symbol}`),

  getKlines: (client: APIClient, symbol: string, interval: string, limit = 500) => 
    client.fetch<KlineData[]>(`/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`),

  getOpenOrders: (client: APIClient, symbol: string, user: string) =>
    client.fetch<Order[]>(`/openOrders?symbol=${symbol}&user=${user}`),

  getAllOrders: (client: APIClient, symbol: string, user: string) => 
    client.fetch<Order[]>(`/allOrders?user=${user}&symbol=${symbol}`),

  getAccount: (client: APIClient, user: string) => 
    client.fetch<AccountInfo>(`/account?address=${user}`),
};