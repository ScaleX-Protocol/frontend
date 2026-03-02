'use client';

import { X, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import { logger } from '@/utils/prodLogger';

interface Order {
  orderId: string;
  user: string;
  price: string;
  quantity: string;
  filled: string;
  remaining: string;
  status: string;
  type: string;
  timestamp: number;
  side: string;
  tag: string;
}

interface PriceLevel {
  price: string;
  quantity: string;
  orders: Order[];
}

interface DepthData {
  lastUpdateId: number;
  symbol: string;
  poolId: string;
  bids: PriceLevel[];
  asks: PriceLevel[];
  summary: {
    totalBidOrders: number;
    totalAskOrders: number;
    totalBidQuantity: string;
    totalAskQuantity: string;
    highestBid: string;
    lowestAsk: string;
    walletSummary: Record<string, number>;
  };
}

interface DepthBreakdownModalProps {
  symbol: string;
  onClose: () => void;
}

const log = logger.withContext({ component: 'DepthBreakdownModal' });

export default function DepthBreakdownModal({ symbol, onClose }: DepthBreakdownModalProps) {
  const [depthData, setDepthData] = useState<DepthData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriceLevel, setSelectedPriceLevel] = useState<PriceLevel | null>(null);

  const fetchDepthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://base-sepolia-api.scalex.money/api/depth-orders?symbol=${symbol}`
      );
      const result = await response.json();
      setDepthData(result);
    } catch (err) {
      setError('Error fetching depth data: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepthData();
  }, [symbol, fetchDepthData]);

  const formatNumber = (value: string, decimals: number = 18) => {
    const num = parseFloat(value) / 10 ** decimals;
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  const formatPrice = (value: string) => {
    return formatNumber(value, 6);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1A1A1A] rounded-lg shadow-2xl border border-[#3A3A3A] w-full max-w-7xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#2A2A2A] text-white px-6 py-4 rounded-t-lg flex justify-between items-center border-b border-[#3A3A3A]">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-5 h-5 text-[#F06718]" />
            <span className="font-medium text-lg">Depth Breakdown - {symbol}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchDepthData}
              disabled={loading}
              className="p-2 hover:bg-[#3A3A3A] rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#3A3A3A] rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-900/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && !depthData ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
              <p>Loading depth data...</p>
            </div>
          ) : depthData ? (
            <div className="space-y-6">
              {/* Summary Section */}
              <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <div className="text-xs text-gray-400">Total Bid Orders</div>
                    <div className="text-lg font-semibold text-green-400">
                      {depthData.summary.totalBidOrders.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Total Ask Orders</div>
                    <div className="text-lg font-semibold text-red-400">
                      {depthData.summary.totalAskOrders.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Highest Bid</div>
                    <div className="text-lg font-semibold text-green-400 font-mono">
                      {formatPrice(depthData.summary.highestBid)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Lowest Ask</div>
                    <div className="text-lg font-semibold text-red-400 font-mono">
                      {formatPrice(depthData.summary.lowestAsk)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Total Bid Quantity</div>
                    <div className="text-lg font-semibold text-gray-300 font-mono">
                      {formatNumber(depthData.summary.totalBidQuantity)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400">Total Ask Quantity</div>
                    <div className="text-lg font-semibold text-gray-300 font-mono">
                      {formatNumber(depthData.summary.totalAskQuantity)}
                    </div>
                  </div>
                </div>

                {/* Wallet Summary */}
                {Object.keys(depthData.summary.walletSummary).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-[#3A3A3A]">
                    <div className="text-xs text-gray-400 mb-2">Wallet Summary</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(depthData.summary.walletSummary).map(([wallet, count]) => (
                        <div
                          key={wallet}
                          className="bg-[#3A3A3A] px-3 py-1 rounded text-xs"
                        >
                          <span className="text-gray-300">{wallet}:</span>{' '}
                          <span className="text-[#F06718] font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bids and Asks */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Bids */}
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
                  <h3 className="text-sm font-semibold text-green-400 mb-1 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Bids ({depthData.bids.length} levels)
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">Click on a price level to view orders</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {depthData.bids.map((level, idx) => (
                      <div
                        key={idx}
                        className={`bg-[#1A1A1A] rounded p-3 border cursor-pointer transition-all ${
                          selectedPriceLevel?.price === level.price
                            ? 'border-green-400 bg-green-900/20'
                            : 'border-[#3A3A3A] hover:border-green-400/50 hover:bg-green-900/10'
                        }`}
                        onClick={() => {
                          log.info('Bid level clicked', { price: level.price, quantity: level.quantity, orderCount: level.orders.length, symbol });
                          setSelectedPriceLevel(level);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-green-400 font-mono text-sm font-semibold">
                            {formatPrice(level.price)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {level.orders.length} order{level.orders.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Qty: <span className="text-gray-300 font-mono">{formatNumber(level.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Asks */}
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
                  <h3 className="text-sm font-semibold text-red-400 mb-1 flex items-center">
                    <TrendingDown className="w-4 h-4 mr-2" />
                    Asks ({depthData.asks.length} levels)
                  </h3>
                  <p className="text-xs text-gray-500 mb-3">Click on a price level to view orders</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {depthData.asks.map((level, idx) => (
                      <div
                        key={idx}
                        className={`bg-[#1A1A1A] rounded p-3 border cursor-pointer transition-all ${
                          selectedPriceLevel?.price === level.price
                            ? 'border-red-400 bg-red-900/20'
                            : 'border-[#3A3A3A] hover:border-red-400/50 hover:bg-red-900/10'
                        }`}
                        onClick={() => {
                          log.info('Ask level clicked', { price: level.price, quantity: level.quantity, orderCount: level.orders.length, symbol });
                          setSelectedPriceLevel(level);
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-red-400 font-mono text-sm font-semibold">
                            {formatPrice(level.price)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {level.orders.length} order{level.orders.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="text-xs text-gray-400">
                          Qty: <span className="text-gray-300 font-mono">{formatNumber(level.quantity)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Price Level Details */}
              {selectedPriceLevel && (
                <div className="bg-[#2A2A2A] rounded-lg p-4 border border-[#3A3A3A]">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-300">
                      Orders at Price: {formatPrice(selectedPriceLevel.price)}
                    </h3>
                    <button
                      onClick={() => setSelectedPriceLevel(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedPriceLevel.orders.map((order) => (
                      <div
                        key={order.orderId}
                        className="bg-[#1A1A1A] rounded p-3 border border-[#3A3A3A]"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded ${
                              order.side === 'buy'
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                            }`}>
                              {order.side.toUpperCase()}
                            </span>
                            <span className="text-xs text-gray-400">#{order.orderId}</span>
                          </div>
                          <span className="text-xs bg-[#F06718] text-white px-2 py-1 rounded">
                            {order.tag}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-400">User:</span>{' '}
                            <span className="text-gray-300 font-mono">
                              {order.user.substring(0, 6)}...{order.user.slice(-4)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Status:</span>{' '}
                            <span className="text-gray-300">{order.status}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Quantity:</span>{' '}
                            <span className="text-gray-300 font-mono">{formatNumber(order.quantity)}</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Remaining:</span>{' '}
                            <span className="text-gray-300 font-mono">{formatNumber(order.remaining)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
