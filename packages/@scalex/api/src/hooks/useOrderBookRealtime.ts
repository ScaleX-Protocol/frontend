import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TradingService } from '../services/trading.service';
import { apiClient } from '../client/api-client';
import WebSocketManager from '../client/socket-manager';
import { ENDPOINTS } from '@scalex/config';

export function useOrderBookRealtime(symbol: string) {
  const queryClient = useQueryClient();
  const queryKey = ['orderbook', symbol];

  // 1. Fetch Initial Order Book Snapshot
  const query = useQuery({
    queryKey,
    queryFn: () => TradingService.getDepth(apiClient, symbol),
    enabled: !!symbol,
    staleTime: Infinity, 
  });

  useEffect(() => {
    if (!symbol) return;

    // 2. Inisialisasi WebSocket (Sesuaikan URL dengan endpoint Order Book kamu)
    const wsUrl = `${ENDPOINTS.wsUrl}/orderbook?symbol=${symbol}`;
    const ws = WebSocketManager.getInstance({
      url: wsUrl,
      onLog: (level, msg) => console.debug(`[OrderBook-WS] ${msg}`),
    });

    ws.connect();

    // 3. Callback untuk menangani update Order Book
    const callback = {
      onMessage: (event: MessageEvent) => {
        try {
          const update = JSON.parse(event.data);

          queryClient.setQueryData(queryKey, (oldData: any) => {
            if (!oldData) return update;

            // Logika Update: 
            // Biasanya WS mengirimkan full snapshot baru atau delta (perubahan saja).
            // Jika delta, kamu harus me-merge-nya. Jika full, tinggal return data baru.
            
            // Contoh jika WS memberikan FULL update:
            return {
              ...oldData,
              bids: update.bids ?? oldData.bids,
              asks: update.asks ?? oldData.asks,
              lastUpdateId: update.lastUpdateId, // Penting untuk sinkronisasi
            };
          });
        } catch (error) {
          console.error("Error parsing OrderBook WS message:", error);
        }
      },
    };

    // Daftarkan listener
    const unsubscribe = ws.addCallback(callback);

    // 4. Cleanup saat komponen unmount atau symbol berubah
    return () => {
      unsubscribe();
    };
  }, [symbol, queryClient, queryKey]);

  return query;
}