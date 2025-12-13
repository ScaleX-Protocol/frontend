export type ViewMode = 'both' | 'bids' | 'asks';

export type SpreadOption = 0.01 | 0.1 | 1 | 10 | 50 | 100;

export interface Trade {
  id: string;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface DepthResponse {
  lastUpdateId: number;
  bids: [string, string][]; // [price, quantity]
  asks: [string, string][]; // [price, quantity]
}
