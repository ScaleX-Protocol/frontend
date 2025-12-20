import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import { useWebSocket } from '@/providers/websocketProvider';
import type { AccountData, BalanceData, UseAccountParams, UseAccountReturn } from './types';
import { logger } from '@/utils/logger';

interface BalanceResponse {
  asset: string;
  free: number;
  locked: number;
}

interface AccountResponse {
  makerCommission: number;
  takerCommission: number;
  buyerCommission: number;
  sellerCommission: number;
  canTrade: boolean;
  canWithdraw: boolean;
  canDeposit: boolean;
  updateTime: number;
  accountType: string;
  balances: BalanceResponse[];
  permissions: string[];
}

// Backend balance update format (Binance-style)
interface BalanceUpdateMessage {
  e: 'balanceUpdate';
  E: number;
  a: string;  // asset
  b: string;  // balance (available)
  l: string;  // locked
}

// Backend account position format
interface OutboundAccountPositionMessage {
  e: 'outboundAccountPosition';
  E: number;
  u: number;
  B: Array<{
    a: string;  // asset
    f: string;  // free
    l: string;  // locked
  }>;
}

/**
 * Hook that combines REST API fetching with WebSocket subscriptions for user account data.
 * Provides initial data loading from /api/account and real-time updates via balance update events.
 *
 * @param params - Configuration parameters
 * @param params.address - User's wallet address
 * @param params.enableRealtime - Whether to enable WebSocket updates (default: true)
 *
 * @example
 * ```tsx
 * const { data, isLoading, getBalance, assetCount, isConnected } = useAccount({
 *   address: '0x123...',
 *   enableRealtime: true
 * });
 *
 * const btcBalance = getBalance('BTC');
 * ```
 */
export function useAccount(params: UseAccountParams): UseAccountReturn {
  const { address, enableRealtime = true } = params;
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const { socket, connectionState, sendMessage } = useWebSocket();
  const isConnected = connectionState === 'open';

  // Initial account data fetch via REST API
  const {
    data: initialData,
    isLoading,
    error,
    refetch
  } = useQuery<AccountResponse, Error>({
    queryKey: ['account', address] as const,
    queryFn: () => fetchIndexerAPI<AccountResponse>(`/account?address=${address}`),
    enabled: !!address,
    refetchInterval: enableRealtime ? false : 10000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: true,
    staleTime: 0,
    structuralSharing: false,
  });

  // Set initial account data from REST response
  useEffect(() => {
    if (initialData && !accountData) {
      const balances: BalanceData[] = initialData.balances.map(b => ({
        ...b,
        isRealtime: false
      }));

      setAccountData({
        ...initialData,
        balances,
        lastUpdate: Date.now(),
        isRealtime: false
      });
    }
  }, [initialData, accountData]);

  // Reset account data when address changes
  useEffect(() => {
    setAccountData(null);
  }, [address]);

  // WebSocket subscription for real-time balance updates
  useEffect(() => {
    if (!socket || !address || !enableRealtime || !isConnected) {
      return;
    }

    logger.info(`[Account] Setting up real-time balance updates for ${address.slice(0, 10)}...`);

    // Subscribe to user balance stream
    const subscriptionMessage = {
      id: Date.now() + Math.random(),
      method: 'SUBSCRIBE',
      params: ['user@balance']
    };
    sendMessage(subscriptionMessage);

    // Handle incoming messages
    const handleMessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data);

        // Handle Binance-style balance update
        if (message.e === 'balanceUpdate') {
          const update = message as BalanceUpdateMessage;

          setAccountData(prev => {
            if (!prev) return null;

            const updatedBalances = [...prev.balances];
            const existingIndex = updatedBalances.findIndex(b => b.asset === update.a);

            const updatedBalance: BalanceData = {
              asset: update.a,
              free: parseFloat(update.b),
              locked: parseFloat(update.l),
              isRealtime: true
            };

            if (existingIndex >= 0) {
              updatedBalances[existingIndex] = updatedBalance;
            } else {
              updatedBalances.push(updatedBalance);
            }

            logger.debug(`[Account] Balance update received`, {
              asset: update.a,
              free: update.b,
              locked: update.l
            });

            return {
              ...prev,
              balances: updatedBalances,
              lastUpdate: Date.now(),
              isRealtime: true
            };
          });
        }

        // Handle outbound account position (full balance snapshot)
        if (message.e === 'outboundAccountPosition') {
          const update = message as OutboundAccountPositionMessage;

          setAccountData(prev => {
            if (!prev) return null;

            const updatedBalances: BalanceData[] = update.B.map(b => ({
              asset: b.a,
              free: parseFloat(b.f),
              locked: parseFloat(b.l),
              isRealtime: true
            }));

            logger.debug(`[Account] Account position update received`, {
              balanceCount: updatedBalances.length
            });

            return {
              ...prev,
              balances: updatedBalances,
              lastUpdate: Date.now(),
              isRealtime: true
            };
          });
        }
      } catch (err) {
        logger.error('Failed to parse balance WebSocket message', { error: err });
      }
    };

    socket.addEventListener('message', handleMessage);

    return () => {
      socket.removeEventListener('message', handleMessage);

      // Unsubscribe from balance updates
      const unsubscribeMessage = {
        id: Date.now(),
        method: 'UNSUBSCRIBE',
        params: ['user@balance']
      };
      sendMessage(unsubscribeMessage);

      logger.info(`[Account] Cleaning up real-time balance updates for ${address.slice(0, 10)}...`);
    };
  }, [socket, address, enableRealtime, isConnected, sendMessage]);

  // Get balance for a specific asset
  const getBalance = useCallback((asset: string): BalanceData | null => {
    if (!accountData?.balances) return null;
    return accountData.balances.find(b => b.asset === asset) || null;
  }, [accountData]);

  // Calculate derived values
  const assetCount = useMemo(() => {
    if (!accountData?.balances) return 0;
    return accountData.balances.filter(b => b.free > 0 || b.locked > 0).length;
  }, [accountData]);

  const refresh = useCallback(() => {
    setAccountData(null);
    refetch();
  }, [refetch]);

  return {
    data: accountData,
    isLoading,
    error,
    refresh,
    isConnected: isConnected && enableRealtime,
    isRealtime: accountData?.isRealtime || false,
    lastUpdate: accountData?.lastUpdate || null,
    getBalance,
    assetCount
  };
}
