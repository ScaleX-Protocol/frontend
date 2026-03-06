'use client';

import { X, RefreshCw, Wallet, TrendingUp, Package, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useEffect, useState } from 'react';
import { logger } from '@/utils/prodLogger';

interface OnChainBalances {
  ETH: string;
  WETH: string;
  USDC: string;
}

interface DepositedBalance {
  symbol: string;
  available: string;
  locked: string;
  decimals: number;
}

interface Orders {
  open: number;
  filled: number;
  cancelled: number;
}

interface OrderDetail {
  orderId: string;
  poolId: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  type: string;
  status: string;
  price: string;
  quantity: string;
  filled: string;
  remaining: string;
  timestamp: number;
  createdAt: string;
}

interface WalletDetails {
  address: string;
  walletIndex: number;
  walletName: string;
  onChainBalances: OnChainBalances;
  depositedBalances: DepositedBalance[];
  ordersSummary: Orders;
  ordersHistory: OrderDetail[];
}

interface WalletData {
  index: number;
  name: string;
  address: string;
  privateKey: string;
  onChainBalances: OnChainBalances;
  depositedBalances: DepositedBalance[];
  orders: Orders;
}

interface WalletMonitorDashboardProps {
  onClose: () => void;
}

export default function WalletMonitorDashboard({ onClose }: WalletMonitorDashboardProps) {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedWallets, setExpandedWallets] = useState<Set<number>>(new Set());
  const [copiedAddress, setCopiedAddress] = useState<number | null>(null);
  const [copiedPrivateKey, setCopiedPrivateKey] = useState<number | null>(null);
  const [walletDetails, setWalletDetails] = useState<Map<string, WalletDetails>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());

  const log = logger.withContext({ component: 'WalletMonitorDashboard' });

  const fetchWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://base-sepolia-api.scalex.money/wallets');
      const result = await response.json();

      if (result.success) {
        setWallets(result.data.wallets);
      } else {
        setError('Failed to fetch wallets');
      }
    } catch (err) {
      setError('Error fetching wallets: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWalletDetails = async (address: string) => {
    if (walletDetails.has(address)) {
      return; // Already fetched
    }

    setLoadingDetails(prev => new Set(prev).add(address));
    try {
      const response = await fetch(`https://base-sepolia-api.scalex.money/wallets/${address}`);
      const result = await response.json();

      if (result.success) {
        setWalletDetails(prev => new Map(prev).set(address, result.data));
      }
    } catch (err) {
      log.error('Error fetching wallet details', {
        error: err instanceof Error ? err.message : 'Unknown error',
        walletAddress: address
      });
    } finally {
      setLoadingDetails(prev => {
        const newSet = new Set(prev);
        newSet.delete(address);
        return newSet;
      });
    }
  };

  const toggleWallet = (index: number, address: string) => {
    const newExpanded = new Set(expandedWallets);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
      // Fetch wallet details when expanding
      fetchWalletDetails(address);
    }
    setExpandedWallets(newExpanded);
  };

  const formatBalance = (balance: string, decimals: number = 18) => {
    const num = parseFloat(balance);
    if (num === 0) return '0';
    if (num < 0.0001) return num.toExponential(2);
    if (num < 1) return num.toFixed(6);
    if (num < 1000) return num.toFixed(4);
    return num.toLocaleString('en-US', { maximumFractionDigits: 2 });
  };

  
  const copyToClipboard = async (text: string, type: 'address' | 'privateKey', walletIndex: number) => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'address') {
        setCopiedAddress(walletIndex);
        setTimeout(() => setCopiedAddress(null), 2000);
      } else {
        setCopiedPrivateKey(walletIndex);
        setTimeout(() => setCopiedPrivateKey(null), 2000);
      }
    } catch (err) {
      log.error('Failed to copy to clipboard', {
        error: err instanceof Error ? err.message : 'Unknown error',
        copyType: type,
        walletIndex: walletIndex
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 'var(--z-modal)' }}>
      <div className="bg-white rounded-lg shadow-2xl border border-gray-300 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-black text-white px-6 py-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <Wallet className="w-5 h-5" />
            <span className="font-medium text-lg">Wallet Monitor</span>
            {!loading && (
              <span className="text-xs bg-gray-800 px-3 py-1 rounded-full">
                {wallets.length} wallets
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={fetchWallets}
              disabled={loading}
              className="p-2 hover:bg-gray-700 rounded transition-colors disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {loading && wallets.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 animate-spin opacity-50" />
              <p>Loading wallets...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.index}
                  className="border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  {/* Wallet Header */}
                  <button
                    onClick={() => toggleWallet(wallet.index, wallet.address)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <Wallet className="w-5 h-5 text-gray-600" />
                      <div className="text-left">
                        <div className="font-medium text-gray-900">{wallet.name}</div>
                        <div className="text-xs text-gray-500 font-mono">
                          {wallet.address.substring(0, 10)}...{wallet.address.slice(-8)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-700">
                          {wallet.orders.open} open orders
                        </div>
                        <div className="text-xs text-gray-500">
                          {wallet.orders.filled} filled, {wallet.orders.cancelled} cancelled
                        </div>
                      </div>
                      {expandedWallets.has(wallet.index) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Details */}
                  {expandedWallets.has(wallet.index) && (
                    <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                      {/* Wallet Address & Private Key */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                          <div className="flex-1">
                            <div className="text-xs text-gray-500 mb-1">Address</div>
                            <div className="font-mono text-sm text-gray-900 break-all">
                              {wallet.address}
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(wallet.address, 'address', wallet.index)}
                            className="ml-3 p-2 hover:bg-gray-200 rounded transition-colors"
                            title="Copy address"
                          >
                            {copiedAddress === wallet.index ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                        </div>
                        <div className="flex items-center justify-between bg-red-50 rounded-lg p-3 border border-red-100">
                          <div className="flex-1">
                            <div className="text-xs text-red-500 mb-1">Private Key</div>
                            <div className="font-mono text-sm text-gray-900 break-all">
                              {wallet.privateKey}
                            </div>
                          </div>
                          <button
                            onClick={() => copyToClipboard(wallet.privateKey, 'privateKey', wallet.index)}
                            className="ml-3 p-2 hover:bg-red-200 rounded transition-colors"
                            title="Copy private key"
                          >
                            {copiedPrivateKey === wallet.index ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-red-600" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* On-Chain Balances */}
                      <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>On-Chain Balances</span>
                        </h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500">ETH</div>
                            <div className="font-medium text-gray-900">
                              {formatBalance(wallet.onChainBalances.ETH)}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500">WETH</div>
                            <div className="font-medium text-gray-900">
                              {formatBalance(wallet.onChainBalances.WETH)}
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500">USDC</div>
                            <div className="font-medium text-gray-900">
                              {formatBalance(wallet.onChainBalances.USDC)}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Deposited Balances */}
                      {wallet.depositedBalances.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                            <TrendingUp className="w-4 h-4" />
                            <span>Deposited Balances</span>
                          </h4>
                          <div className="space-y-2">
                            {wallet.depositedBalances.map((balance, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 rounded-lg p-3 flex items-center justify-between"
                              >
                                <div>
                                  <div className="font-medium text-gray-900 text-sm">
                                    {balance.symbol}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    Decimals: {balance.decimals}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm">
                                    <span className="text-green-600 font-medium">
                                      {formatBalance(balance.available, balance.decimals)}
                                    </span>
                                    <span className="text-gray-400 mx-1">/</span>
                                    <span className="text-orange-600 font-medium">
                                      {formatBalance(balance.locked, balance.decimals)}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    available / locked
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Orders History */}
                      {walletDetails.has(wallet.address) && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                            <Package className="w-4 h-4" />
                            <span>Orders History</span>
                            <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                              {walletDetails.get(wallet.address)?.ordersHistory.length || 0} orders
                            </span>
                          </h4>
                          {loadingDetails.has(wallet.address) ? (
                            <div className="text-center py-8 text-gray-500">
                              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin opacity-50" />
                              <p className="text-sm">Loading orders...</p>
                            </div>
                          ) : (
                            <div className="max-h-96 overflow-y-auto space-y-2">
                              {walletDetails.get(wallet.address)?.ordersHistory.map((order) => (
                                <div
                                  key={order.orderId}
                                  className={`bg-gray-50 rounded-lg p-3 border ${
                                    order.side === 'BUY'
                                      ? 'border-green-200 bg-green-50/50'
                                      : 'border-red-200 bg-red-50/50'
                                  }`}
                                >
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <div className="flex items-center space-x-2 mb-1">
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                          order.side === 'BUY'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-red-600 text-white'
                                        }`}>
                                          {order.side}
                                        </span>
                                        <span className="font-medium text-sm text-gray-900">
                                          {order.symbol}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded ${
                                          order.status === 'OPEN'
                                            ? 'bg-blue-100 text-blue-700'
                                            : order.status === 'FILLED'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-700'
                                        }`}>
                                          {order.status}
                                        </span>
                                      </div>
                                      <div className="text-xs text-gray-600 space-y-1">
                                        <div className="flex items-center space-x-4">
                                          <span>Order ID: <span className="font-mono">{order.orderId}</span></span>
                                          <span>Type: {order.type}</span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <span>Price: <span className="font-mono">{formatBalance(order.price, 6)}</span></span>
                                          <span>Qty: <span className="font-mono">{formatBalance(order.quantity, 18)}</span></span>
                                        </div>
                                        <div className="flex items-center space-x-4">
                                          <span>Filled: <span className="font-mono">{formatBalance(order.filled, 18)}</span></span>
                                          <span>Remaining: <span className="font-mono">{formatBalance(order.remaining, 18)}</span></span>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="text-right text-xs text-gray-500">
                                      <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                                      <div>{new Date(order.createdAt).toLocaleTimeString()}</div>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 font-mono truncate">
                                    Pool: {order.poolId}
                                  </div>
                                </div>
                              ))}
                              {walletDetails.get(wallet.address)?.ordersHistory.length === 0 && (
                                <div className="text-center py-6 text-gray-500 text-sm">
                                  No orders found
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
