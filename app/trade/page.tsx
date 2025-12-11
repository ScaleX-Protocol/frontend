'use client';

import dynamic from 'next/dynamic';

const AppHeader = dynamic(() => import('@/components/appHeader'), {
  ssr: false,
});

const Trade = dynamic(() => import('@/features/trade/components/trade'), {
  ssr: false,
});

export default function TradePage() {
  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <Trade />
    </div>
  );
}
