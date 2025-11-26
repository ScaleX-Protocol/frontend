import type { DepthResponse, Trade as OrderBookTrade } from '@/features/trade/types/orderBook.types';
import type { KlineData, Market, TradingPair } from '@/features/trade/types/chart.types';

type IntervalId = '1m' | '5m' | '30m' | '1h' | '1d';

interface IntervalConfig {
  id: IntervalId;
  durationMs: number;
  maxCandles: number;
}

interface MarketConfig extends TradingPair {
  basePrice: number;
  volatility: number;
  createdAt: number;
}

interface TradeRecord {
  id: string;
  price: number;
  qty: number;
  time: number;
  isBuyerMaker: boolean;
  isBestMatch: boolean;
}

interface CandleState {
  openTime: number;
  closeTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  quoteVolume: number;
  numberOfTrades: number;
  takerBuyBaseVolume: number;
  takerBuyQuoteVolume: number;
}

interface MarketState {
  config: MarketConfig;
  midPrice: number;
  bids: Array<{ price: number; qty: number }>;
  asks: Array<{ price: number; qty: number }>;
  trades: TradeRecord[];
  candles: Record<IntervalId, CandleState[]>;
  lastUpdateId: number;
  lastTradeId: number;
  liquidity: {
    bid: number;
    ask: number;
    volume24hBase: number;
    volume24hQuote: number;
  };
}

const ENGINE_TICK_MS = 1500;
const MAX_TRADES = 1000;
const DEPTH_LEVELS = 30;
const TRADE_BATCH_PER_TICK = { min: 1, max: 4 };

const INTERVAL_CONFIGS: IntervalConfig[] = [
  { id: '1m', durationMs: 60 * 1000, maxCandles: 800 },
  { id: '5m', durationMs: 5 * 60 * 1000, maxCandles: 800 },
  { id: '30m', durationMs: 30 * 60 * 1000, maxCandles: 800 },
  { id: '1h', durationMs: 60 * 60 * 1000, maxCandles: 800 },
  { id: '1d', durationMs: 24 * 60 * 60 * 1000, maxCandles: 400 },
];

const MARKET_CONFIGS: MarketConfig[] = [
  {
    symbol: 'gsWBTCgsUSDC',
    baseAsset: 'gsWBTC',
    quoteAsset: 'gsUSDC',
    poolId: 'd4e9af22b490b35bc5bebb6036644e54b11af5711ba8d79e05c7e3f8098b65cd',
    baseDecimals: 8,
    quoteDecimals: 6,
    basePrice: 45000,
    volatility: 0.0025,
    createdAt: Date.now() - 86400 * 1000 * 30,
  },
  {
    symbol: 'gsWETHgsUSDC',
    baseAsset: 'gsWETH',
    quoteAsset: 'gsUSDC',
    poolId: '0e8a870fae2e832b4ea885fb193b6d7c66050ae6932376705dce03c99b4f2a18',
    baseDecimals: 18,
    quoteDecimals: 6,
    basePrice: 2500,
    volatility: 0.0035,
    createdAt: Date.now() - 86400 * 1000 * 10,
  },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function scaleNumber(value: number, decimals: number) {
  if (!Number.isFinite(value)) {
    return '0';
  }

  let valueStr = value.toString();
  if (valueStr.includes('e') || valueStr.includes('E')) {
    valueStr = value.toFixed(decimals + 2);
  }

  const [intPartRaw, fracPartRaw = ''] = valueStr.split('.');
  const frac = (fracPartRaw + '0'.repeat(decimals)).slice(0, decimals);
  const combined = `${intPartRaw}${frac}`;
  const trimmed = combined.replace(/^(-?)0+(?=\d)/, '$1');
  return trimmed.length && trimmed !== '-' ? trimmed : '0';
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeSymbolInput(symbol: string) {
  if (!symbol) return '';
  return symbol.replace('/', '').trim();
}

export function normalizeSymbol(symbol: string) {
  return normalizeSymbolInput(symbol);
}

class MockTradingEngine {
  private markets: Map<string, MarketState> = new Map();
  private timer?: NodeJS.Timeout;

  constructor() {
    MARKET_CONFIGS.forEach((config) => {
      const state = this.createMarketState(config);
      this.markets.set(config.symbol, state);
    });

    this.timer = setInterval(() => {
      this.tick();
    }, ENGINE_TICK_MS);
  }

  private createMarketState(config: MarketConfig): MarketState {
    const state: MarketState = {
      config,
      midPrice: config.basePrice,
      bids: [],
      asks: [],
      trades: [],
      candles: {
        '1m': [],
        '5m': [],
        '30m': [],
        '1h': [],
        '1d': [],
      },
      lastUpdateId: Date.now(),
      lastTradeId: 1,
      liquidity: {
        bid: 0,
        ask: 0,
        volume24hBase: 0,
        volume24hQuote: 0,
      },
    };

    state.trades = this.seedTrades(state, 400);
    this.buildInitialDepth(state);
    this.recalculateLiquidity(state);
    this.seedCandlesFromTrades(state);

    return state;
  }

  private seedTrades(state: MarketState, count: number) {
    const trades: TradeRecord[] = [];
    const now = Date.now();

    for (let i = 0; i < count; i++) {
      const time = now - i * 2000;
      const priceShift = randomBetween(-state.config.volatility, state.config.volatility) * state.config.basePrice * 10;
      const price = clamp(state.config.basePrice + priceShift, state.config.basePrice * 0.6, state.config.basePrice * 1.4);
      const qty = this.randomQuantity(state.config.baseDecimals);
      trades.push({
        id: `${state.config.symbol}-${time}-${i}`,
        price,
        qty,
        time,
        isBuyerMaker: Math.random() > 0.5,
        isBestMatch: true,
      });
    }

    return trades.sort((a, b) => b.time - a.time);
  }

  private seedCandlesFromTrades(state: MarketState) {
    INTERVAL_CONFIGS.forEach((interval) => {
      const grouped: CandleState[] = [];
      const trades = [...state.trades].sort((a, b) => a.time - b.time);

      let candle: CandleState | null = null;

      trades.forEach((trade) => {
        const openTime = Math.floor(trade.time / interval.durationMs) * interval.durationMs;
        const closeTime = openTime + interval.durationMs - 1;

        if (!candle || candle.openTime !== openTime) {
          if (candle) {
            grouped.push(candle);
          }
          candle = {
            openTime,
            closeTime,
            open: trade.price,
            high: trade.price,
            low: trade.price,
            close: trade.price,
            volume: 0,
            quoteVolume: 0,
            numberOfTrades: 0,
            takerBuyBaseVolume: 0,
            takerBuyQuoteVolume: 0,
          };
        }

        candle.high = Math.max(candle.high, trade.price);
        candle.low = Math.min(candle.low, trade.price);
        candle.close = trade.price;
        candle.volume += trade.qty;
        candle.quoteVolume += trade.qty * trade.price;
        candle.numberOfTrades += 1;

        const takerBuyVolume = trade.isBuyerMaker ? trade.qty : 0;
        candle.takerBuyBaseVolume += takerBuyVolume;
        candle.takerBuyQuoteVolume += takerBuyVolume * trade.price;
      });

      if (candle) {
        grouped.push(candle);
      }
      state.candles[interval.id] = grouped.slice(-interval.maxCandles);
    });
  }

  private buildInitialDepth(state: MarketState) {
    state.bids = this.buildOrderLevels(state, 'bid');
    state.asks = this.buildOrderLevels(state, 'ask');
  }

  private buildOrderLevels(state: MarketState, side: 'bid' | 'ask') {
    const levels: Array<{ price: number; qty: number }> = [];
    const basePrice = state.midPrice;
    const spreadBps = 0.02;

    for (let i = 0; i < DEPTH_LEVELS; i++) {
      const depthFactor = (i + 1) / DEPTH_LEVELS;
      const offset = basePrice * spreadBps * depthFactor;
      const price = side === 'bid' ? basePrice - offset : basePrice + offset;
      const qty = this.randomQuantity(state.config.baseDecimals);

      levels.push({
        price: clamp(price, state.config.basePrice * 0.4, state.config.basePrice * 1.6),
        qty,
      });
    }

    return levels;
  }

  private randomQuantity(baseDecimals: number) {
    const magnitude = baseDecimals > 8 ? 3 : 0.3;
    return randomBetween(0.01, 1) * magnitude;
  }

  private tick() {
    this.markets.forEach((state) => {
      const drift = 1 + randomBetween(-state.config.volatility, state.config.volatility);
      state.midPrice = clamp(state.midPrice * drift, state.config.basePrice * 0.5, state.config.basePrice * 1.5);
      state.lastUpdateId += 1;

      state.bids = this.buildOrderLevels(state, 'bid');
      state.asks = this.buildOrderLevels(state, 'ask');

      const tradesToGenerate = Math.floor(randomBetween(TRADE_BATCH_PER_TICK.min, TRADE_BATCH_PER_TICK.max));
      for (let i = 0; i < tradesToGenerate; i++) {
        this.addTrade(state);
      }

      state.trades = state.trades.slice(0, MAX_TRADES);
      this.recalculateLiquidity(state);
    });
  }

  private addTrade(state: MarketState) {
    const priceDelta = randomBetween(-state.config.volatility, state.config.volatility) * state.midPrice;
    const price = clamp(state.midPrice + priceDelta, state.config.basePrice * 0.5, state.config.basePrice * 1.5);
    const qty = this.randomQuantity(state.config.baseDecimals) * randomBetween(0.5, 2);
    const trade: TradeRecord = {
      id: `${state.config.symbol}-${Date.now()}-${state.lastTradeId++}`,
      price,
      qty,
      time: Date.now(),
      isBuyerMaker: Math.random() > 0.5,
      isBestMatch: true,
    };

    state.trades.unshift(trade);
    this.updateCandlesWithTrade(state, trade);
  }

  private updateCandlesWithTrade(state: MarketState, trade: TradeRecord) {
    INTERVAL_CONFIGS.forEach((interval) => {
      const openTime = Math.floor(trade.time / interval.durationMs) * interval.durationMs;
      const closeTime = openTime + interval.durationMs - 1;
      let candles = state.candles[interval.id];
      if (!candles) {
        candles = [];
        state.candles[interval.id] = candles;
      }

      let candle = candles[candles.length - 1];
      if (!candle || candle.openTime !== openTime) {
        candle = {
          openTime,
          closeTime,
          open: candle ? candle.close : trade.price,
          high: trade.price,
          low: trade.price,
          close: trade.price,
          volume: 0,
          quoteVolume: 0,
          numberOfTrades: 0,
          takerBuyBaseVolume: 0,
          takerBuyQuoteVolume: 0,
        };
        candles.push(candle);
        if (candles.length > interval.maxCandles) {
          candles.shift();
        }
      }

      candle.high = Math.max(candle.high, trade.price);
      candle.low = Math.min(candle.low, trade.price);
      candle.close = trade.price;
      candle.volume += trade.qty;
      candle.quoteVolume += trade.qty * trade.price;
      candle.numberOfTrades += 1;

      if (!trade.isBuyerMaker) {
        candle.takerBuyBaseVolume += trade.qty;
        candle.takerBuyQuoteVolume += trade.qty * trade.price;
      }
    });
  }

  private recalculateLiquidity(state: MarketState) {
    const bidLiquidity = state.bids.slice(0, 10).reduce((sum, level) => sum + level.qty, 0);
    const askLiquidity = state.asks.slice(0, 10).reduce((sum, level) => sum + level.qty, 0);
    const trades24h = state.trades.filter((trade) => trade.time >= Date.now() - 24 * 60 * 60 * 1000);
    const volumeBase = trades24h.reduce((sum, trade) => sum + trade.qty, 0);
    const volumeQuote = trades24h.reduce((sum, trade) => sum + trade.qty * trade.price, 0);

    state.liquidity = {
      bid: bidLiquidity,
      ask: askLiquidity,
      volume24hBase: volumeBase,
      volume24hQuote: volumeQuote,
    };
  }

  private formatTrade(state: MarketState, trade: TradeRecord): OrderBookTrade {
    return {
      id: trade.id,
      price: scaleNumber(trade.price, state.config.quoteDecimals),
      qty: scaleNumber(trade.qty, state.config.baseDecimals),
      time: trade.time,
      isBuyerMaker: trade.isBuyerMaker,
      isBestMatch: trade.isBestMatch,
    };
  }

  private formatCandle(state: MarketState, candle: CandleState): KlineData {
    const { quoteDecimals } = state.config;

    return {
      openTime: candle.openTime,
      open: scaleNumber(candle.open, quoteDecimals),
      high: scaleNumber(candle.high, quoteDecimals),
      low: scaleNumber(candle.low, quoteDecimals),
      close: scaleNumber(candle.close, quoteDecimals),
      volume: candle.volume.toFixed(4),
      closeTime: candle.closeTime,
      quoteVolume: candle.quoteVolume.toFixed(2),
      numberOfTrades: candle.numberOfTrades,
      takerBuyBaseVolume: candle.takerBuyBaseVolume.toFixed(4),
      takerBuyQuoteVolume: candle.takerBuyQuoteVolume.toFixed(2),
      ignored: '0',
    };
  }

  public async wait(ms = 80) {
    await delay(ms);
  }

  public getDepth(symbolParam: string, limit = 50): DepthResponse {
    const symbol = normalizeSymbolInput(symbolParam);
    const state = this.markets.get(symbol);
    if (!state) {
      throw new Error(`Unknown symbol: ${symbolParam}`);
    }

    const bids = state.bids.slice(0, limit).map((level) => [
      scaleNumber(level.price, state.config.quoteDecimals),
      scaleNumber(level.qty, state.config.baseDecimals),
    ]) as [string, string][];

    const asks = state.asks.slice(0, limit).map((level) => [
      scaleNumber(level.price, state.config.quoteDecimals),
      scaleNumber(level.qty, state.config.baseDecimals),
    ]) as [string, string][];

    return {
      lastUpdateId: state.lastUpdateId,
      bids,
      asks,
    };
  }

  public getTrades(symbolParam: string, limit = 100, orderBy: 'asc' | 'desc' = 'desc'): OrderBookTrade[] {
    const symbol = normalizeSymbolInput(symbolParam);
    const state = this.markets.get(symbol);
    if (!state) {
      throw new Error(`Unknown symbol: ${symbolParam}`);
    }

    const trades = orderBy === 'asc' ? [...state.trades].reverse() : [...state.trades];
    return trades.slice(0, limit).map((trade) => this.formatTrade(state, trade));
  }

  public getKlines(symbolParam: string, intervalId: IntervalId, limit = 500, range?: { startTime?: number; endTime?: number }) {
    const symbol = normalizeSymbolInput(symbolParam);
    const state = this.markets.get(symbol);
    if (!state) {
      throw new Error(`Unknown symbol: ${symbolParam}`);
    }

    const interval = INTERVAL_CONFIGS.find((config) => config.id === intervalId) ?? INTERVAL_CONFIGS[0];
    let candles = state.candles[interval.id] || [];

    if (range?.startTime) {
      candles = candles.filter((candle) => candle.closeTime >= range.startTime!);
    }
    if (range?.endTime) {
      candles = candles.filter((candle) => candle.openTime <= range.endTime!);
    }

    const slice = candles.slice(-limit);
    return slice.map((candle) => this.formatCandle(state, candle));
  }

  public getMarkets(): Market[] {
    const markets: Market[] = [];

    this.markets.forEach((state) => {
      markets.push({
        symbol: state.config.symbol,
        baseAsset: state.config.baseAsset,
        quoteAsset: state.config.quoteAsset,
        poolId: state.config.poolId,
        baseDecimals: state.config.baseDecimals,
        quoteDecimals: state.config.quoteDecimals,
        volume: scaleNumber(state.liquidity.volume24hBase, state.config.baseDecimals),
        volumeInQuote: scaleNumber(state.liquidity.volume24hQuote, state.config.quoteDecimals),
        latestPrice: scaleNumber(state.midPrice, state.config.quoteDecimals),
        age: Math.floor((Date.now() - state.config.createdAt) / 1000),
        bidLiquidity: scaleNumber(state.liquidity.bid, state.config.baseDecimals),
        askLiquidity: scaleNumber(state.liquidity.ask, state.config.baseDecimals),
        totalLiquidityInQuote: scaleNumber(
          (state.liquidity.bid + state.liquidity.ask) * state.midPrice,
          state.config.quoteDecimals,
        ),
        createdAt: state.config.createdAt,
      });
    });

    return markets;
  }

  public getSupportedPairs(): TradingPair[] {
    return MARKET_CONFIGS.map((config) => ({
      symbol: config.symbol,
      baseAsset: config.baseAsset,
      quoteAsset: config.quoteAsset,
      poolId: config.poolId,
      baseDecimals: config.baseDecimals,
      quoteDecimals: config.quoteDecimals,
    }));
  }
}

const globalRef = globalThis as unknown as {
  mockTradingEngine?: MockTradingEngine;
};

export function getMockTradingEngine() {
  if (!globalRef.mockTradingEngine) {
    globalRef.mockTradingEngine = new MockTradingEngine();
  }

  return globalRef.mockTradingEngine;
}

