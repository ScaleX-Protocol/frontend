import type {
  OrderBookData,
  OrderBookEntry,
  OrderBookParams,
  OrderBookPrecision,
  TradesData,
  TradesParams,
} from '../types/orderBook.types';

export class OrderBookAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  // Template method - replace with actual API call
  async fetchOrderBook(params: OrderBookParams): Promise<OrderBookData> {
    // Real implementation:
    // const response = await fetch(`${this.baseUrl}/orderbook?pair=${params.pair}&precision=${params.precision}`);
    // return response.json();

    // Mock implementation:
    return this.generateMockOrderBook(params);
  }

  // Template method - replace with actual API call
  async fetchTrades(params: TradesParams): Promise<TradesData[]> {
    // Real implementation:
    // const response = await fetch(`${this.baseUrl}/trades?pair=${params.pair}&limit=${params.limit}`);
    // return response.json();

    // Mock implementation:
    return this.generateMockTrades(params);
  }

  // ============================================
  // MOCK DATA GENERATORS
  // ============================================

  private generateMockOrderBook(params: OrderBookParams): OrderBookData {
    const { precision = 0.01, pattern = 'bid-ask', limit = 20 } = params;

    // Base price around $103,107 to match the reference image
    const basePrice = 103107.2;
    const midPrice = basePrice + (Math.random() - 0.5) * 10;

    const bids: OrderBookEntry[] = [];
    const asks: OrderBookEntry[] = [];

    // Generate bids (buy orders) - sorted from high to low
    if (pattern === 'bid-ask' || pattern === 'bid-only') {
      let cumulativeTotal = 0;
      for (let i = 0; i < limit; i++) {
        const priceOffset = i * precision * 10; // Increase price offset for more realistic spread
        const price = Math.round((midPrice - priceOffset) / precision) * precision;
        // Vary size more realistically with larger orders near the middle price
        const sizeMultiplier = 1 - (i / limit) * 0.7;
        const size = (Math.random() * 5 + 0.1) * sizeMultiplier;
        cumulativeTotal += size;

        bids.push({
          price: Number(price.toFixed(this.getPrecisionDecimals(precision))),
          size: Number(size.toFixed(4)),
          total: Number(cumulativeTotal.toFixed(4)),
        });
      }
    }

    // Generate asks (sell orders) - sorted from low to high
    if (pattern === 'bid-ask' || pattern === 'ask-only') {
      let cumulativeTotal = 0;
      for (let i = 0; i < limit; i++) {
        const priceOffset = i * precision * 10; // Increase price offset for more realistic spread
        const price = Math.round((midPrice + priceOffset) / precision) * precision;
        // Vary size more realistically with larger orders near the middle price
        const sizeMultiplier = 1 - (i / limit) * 0.7;
        const size = (Math.random() * 5 + 0.1) * sizeMultiplier;
        cumulativeTotal += size;

        asks.push({
          price: Number(price.toFixed(this.getPrecisionDecimals(precision))),
          size: Number(size.toFixed(4)),
          total: Number(cumulativeTotal.toFixed(4)),
        });
      }
    }

    console.log(asks, bids);

    // Calculate spread
    const bestBid = bids.length > 0 ? bids[0].price : 0;
    const bestAsk = asks.length > 0 ? asks[0].price : 0;
    const spread = bestAsk - bestBid;
    const spreadPercentage = bestBid > 0 ? (spread / bestBid) * 100 : 0;

    return {
      bids,
      asks,
      spread: Number(spread.toFixed(this.getPrecisionDecimals(precision))),
      spreadPercentage: Number(spreadPercentage.toFixed(4)),
    };
  }

  private generateMockTrades(params: TradesParams): TradesData[] {
    const { limit = 50 } = params;
    const trades: TradesData[] = [];
    const now = Date.now();
    const basePrice = 2000;

    for (let i = 0; i < limit; i++) {
      const price = basePrice + (Math.random() - 0.5) * 20;
      const total = Math.random() * 3 + 0.01;
      const timeDiff = i * 1000 + Math.random() * 5000; // Trades every 1-6 seconds

      trades.push({
        id: `trade-${now}-${i}`,
        price: Number(price.toFixed(2)),
        total: Number(total.toFixed(4)),
        time: now - timeDiff,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
      });
    }

    return trades.sort((a, b) => b.time - a.time); // Most recent first
  }

  private getPrecisionDecimals(precision: OrderBookPrecision): number {
    if (precision === 0.1) return 1;
    if (precision === 0.01) return 2;
    if (precision === 0.001) return 3;
    return 2;
  }
}
