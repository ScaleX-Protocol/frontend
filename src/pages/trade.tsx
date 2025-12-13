import AppHeader from '@/components/appHeader';
import Trade from '@/features/trade/components/trade';

export default function TradePage() {
  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <Trade />
    </div>
  );
}
