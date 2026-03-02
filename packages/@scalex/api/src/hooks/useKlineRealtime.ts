import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../client/api-client';
import { TradingService } from '../services/trading.service';
import WebSocketManager from '../client/socket-manager';
import { ENDPOINTS } from '@scalex/config';

export function useKlinesRealtime(symbol: string, interval: string, limit = 500) {
  const queryClient = useQueryClient();
  const queryKey = ['klines', symbol, interval, limit];

  // 1. Fetch data awal menggunakan useQuery yang sudah ada
  const query = useQuery({
    queryKey,
    queryFn: () => TradingService.getKlines(apiClient, symbol, interval, limit),
    enabled: !!symbol && !!interval,
    staleTime: Infinity, // Biarkan WebSocket yang mengelola update
  });

  useEffect(() => {
    if (!symbol || !interval) return;

    // 2. Inisialisasi WebSocketManager
    const wsUrl = `${ENDPOINTS.wsUrl}/klines?symbol=${symbol}&interval=${interval}`; 
    const ws = WebSocketManager.getInstance({
      url: wsUrl,
      onLog: (level, msg) => console.log(`[WS-${level}] ${msg}`),
    });

    ws.connect();

    // 3. Callback saat menerima pesan
    const callback = {
      onMessage: (event: MessageEvent) => {
        const newData = JSON.parse(event.data);
        
        // Logika update cache React Query
        queryClient.setQueryData(queryKey, (oldData: any[]) => {
          if (!oldData) return [newData];

          // Contoh logika: jika kline yang datang punya timestamp sama, replace. Jika baru, push/shift.
          const lastIndex = oldData.length - 1;
          const isSameBar = oldData[lastIndex].time === newData.time;

          if (isSameBar) {
            // Update candle yang sedang berjalan
            const updated = [...oldData];
            updated[lastIndex] = newData;
            return updated;
          } else {
            // Tambah candle baru dan buang yang paling lama jika melebihi limit
            const updated = [...oldData, newData];
            if (updated.length > limit) updated.shift();
            return updated;
          }
        });
      },
    };

    // Tambahkan listener
    const unsubscribe = ws.addCallback(callback);

    // 4. Cleanup saat component unmount
    return () => {
      unsubscribe();
      // Jangan panggil ws.close() di sini jika socket dipakai barengan (Singleton)
      // Cukup unsubscribe callback-nya saja.
    };
  }, [symbol, interval, limit, queryClient, queryKey]);

  return query;
}