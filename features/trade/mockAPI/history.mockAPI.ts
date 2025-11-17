import type { Balance, OpenOrder, TradeHistory } from '../types/history.types';

const mockOpenOrders: OpenOrder[] = [
  {
    id: '1',
    pair: 'ETH/USDT',
    type: 'buy',
    price: 2450.5,
    amount: 1.5,
    filled: 0.5,
    total: 3675.75,
    status: 'partial',
    timestamp: '2025-11-13T10:30:00Z',
  },
  {
    id: '2',
    pair: 'BTC/USDT',
    type: 'sell',
    price: 68500.0,
    amount: 0.25,
    filled: 0,
    total: 17125.0,
    status: 'pending',
    timestamp: '2025-11-13T09:15:00Z',
  },
  {
    id: '3',
    pair: 'SOL/USDT',
    type: 'buy',
    price: 105.2,
    amount: 10,
    filled: 10,
    total: 1052.0,
    status: 'completed',
    timestamp: '2025-11-13T08:45:00Z',
  },
  {
    id: '4',
    pair: 'MATIC/USDT',
    type: 'buy',
    price: 0.85,
    amount: 500,
    filled: 250,
    total: 425.0,
    status: 'partial',
    timestamp: '2025-11-13T07:20:00Z',
  },
  {
    id: '5',
    pair: 'LINK/USDT',
    type: 'sell',
    price: 15.75,
    amount: 20,
    filled: 0,
    total: 315.0,
    status: 'pending',
    timestamp: '2025-11-13T06:10:00Z',
  },
];

const mockTradeHistory: TradeHistory[] = [
  {
    id: 't1',
    pair: 'ETH/USDT',
    type: 'buy',
    price: 2420.0,
    amount: 2.0,
    total: 4840.0,
    fee: 4.84,
    timestamp: '2025-11-12T15:30:00Z',
  },
  {
    id: 't2',
    pair: 'BTC/USDT',
    type: 'sell',
    price: 67800.0,
    amount: 0.5,
    total: 33900.0,
    fee: 33.9,
    timestamp: '2025-11-12T14:20:00Z',
  },
  {
    id: 't3',
    pair: 'SOL/USDT',
    type: 'buy',
    price: 102.5,
    amount: 15,
    total: 1537.5,
    fee: 1.54,
    timestamp: '2025-11-12T12:45:00Z',
  },
  {
    id: 't4',
    pair: 'AVAX/USDT',
    type: 'buy',
    price: 38.2,
    amount: 25,
    total: 955.0,
    fee: 0.96,
    timestamp: '2025-11-11T18:10:00Z',
  },
  {
    id: 't5',
    pair: 'MATIC/USDT',
    type: 'sell',
    price: 0.88,
    amount: 1000,
    total: 880.0,
    fee: 0.88,
    timestamp: '2025-11-11T16:35:00Z',
  },
  {
    id: 't6',
    pair: 'DOT/USDT',
    type: 'buy',
    price: 7.65,
    amount: 100,
    total: 765.0,
    fee: 0.77,
    timestamp: '2025-11-11T14:20:00Z',
  },
  {
    id: 't7',
    pair: 'UNI/USDT',
    type: 'sell',
    price: 12.8,
    amount: 50,
    total: 640.0,
    fee: 0.64,
    timestamp: '2025-11-10T20:15:00Z',
  },
  {
    id: 't8',
    pair: 'LINK/USDT',
    type: 'buy',
    price: 15.2,
    amount: 30,
    total: 456.0,
    fee: 0.46,
    timestamp: '2025-11-10T11:45:00Z',
  },
];

const mockBalances: Balance[] = [
  {
    token: 'Ethereum',
    symbol: 'ETH',
    available: 3.5,
    locked: 1.5,
    total: 5.0,
    usdValue: 12252.5,
  },
  {
    token: 'Bitcoin',
    symbol: 'BTC',
    available: 0.75,
    locked: 0.25,
    total: 1.0,
    usdValue: 68500.0,
  },
  {
    token: 'Solana',
    symbol: 'SOL',
    available: 45.5,
    locked: 10.0,
    total: 55.5,
    usdValue: 5838.6,
  },
  {
    token: 'USD Tether',
    symbol: 'USDT',
    available: 15420.5,
    locked: 4500.0,
    total: 19920.5,
    usdValue: 19920.5,
  },
  {
    token: 'Polygon',
    symbol: 'MATIC',
    available: 750,
    locked: 500,
    total: 1250,
    usdValue: 1062.5,
  },
  {
    token: 'Chainlink',
    symbol: 'LINK',
    available: 80,
    locked: 20,
    total: 100,
    usdValue: 1575.0,
  },
  {
    token: 'Avalanche',
    symbol: 'AVAX',
    available: 25,
    locked: 0,
    total: 25,
    usdValue: 955.0,
  },
  {
    token: 'Polkadot',
    symbol: 'DOT',
    available: 100,
    locked: 0,
    total: 100,
    usdValue: 765.0,
  },
];

// Simulated API delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchOpenOrders = async (): Promise<OpenOrder[]> => {
  await delay(500);
  return mockOpenOrders;
};

export const fetchTradeHistory = async (): Promise<TradeHistory[]> => {
  await delay(600);
  return mockTradeHistory;
};

export const fetchBalances = async (): Promise<Balance[]> => {
  await delay(400);
  return mockBalances;
};
