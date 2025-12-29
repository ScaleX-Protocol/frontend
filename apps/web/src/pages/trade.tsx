import { useParams } from '@tanstack/react-router';
import AppHeader from '@/components/appHeader';
import Trade from '@/features/trade/components/trade';

export default function TradePage() {
  // Get pairId from route params (may be undefined if on /trade without pairId)
  const params = useParams({ strict: false }) as { pairId?: string };
  const pairId = params.pairId;

  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <Trade pairId={pairId} />
    </div>
  );
}
