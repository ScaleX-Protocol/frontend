import { useParams } from '@tanstack/react-router';
import AppHeader from '@/components/appHeader';
import Trade from '@/features/trade/components/trade';
import { WebSocketProvider } from '@/providers/websocketProvider';
import { AutoWebSocketSubscriptions } from '@/components/AutoWebSocketSubscriptions';
import { Endpoints } from '@/configs/endpoints';

export default function TradePage() {
  // Get pairId from route params (may be undefined if on /trade without pairId)
  const params = useParams({ strict: false }) as { pairId?: string };
  const pairId = params.pairId;

  return (
    <WebSocketProvider url={Endpoints.websocket}>
      <AutoWebSocketSubscriptions />
      <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
        <AppHeader />
        <Trade />
      </div>
    </WebSocketProvider>
  );
}
