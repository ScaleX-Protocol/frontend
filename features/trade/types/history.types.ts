export interface TradeHistory {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  total: number;
  fee: number;
  timestamp: string;
}

export interface Balance {
  token: string;
  symbol: string;
  available: number;
  locked: number;
  total: number;
  usdValue: number;
}

export interface OpenOrder {
  id: string;
  pair: string;
  type: 'buy' | 'sell';
  price: number;
  amount: number;
  filled: number;
  total: number;
  status: 'pending' | 'partial' | 'completed';
  timestamp: string;
}

export interface Trade {
  id: string;
  price: string;
  qty: string;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

export interface Order {
  symbol: string;
  orderId: string;
  orderListId: number;
  clientOrderId: string;
  price: string;
  origQty: string;
  executedQty: string;
  cumulativeQuoteQty: string;
  status: string;
  timeInForce: string;
  type: string;
  side: string;
  stopPrice: string;
  icebergQty: string;
  time: number;
  updateTime: number;
  isWorking: boolean;
  origQuoteOrderQty: string;
}

export interface AccountInfo {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: Balance[];
  permissions: string[];
}
