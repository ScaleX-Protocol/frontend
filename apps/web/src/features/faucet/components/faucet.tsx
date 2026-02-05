'use client';

import { lazy, Suspense } from 'react';

// Lazy load components for performance
const Form = lazy(() => import('./form/form'));
const History = lazy(() => import('./history/history'));

// Loading skeleton while components load
function FaucetLoadingSkeleton() {
  return (
    <div className="w-full flex-1 flex flex-col gap-4 md:gap-6 animate-pulse">
      {/* Form skeleton */}
      <div className="bg-[#1A1A1A] rounded-[20px] h-[280px] w-full" />
      {/* History skeleton */}
      <div className="bg-[#1A1A1A] rounded-[20px] h-[400px] w-full" />
    </div>
  );
}

export default function Faucet() {
  return (
    <div className="w-full flex-1 p-5 md:p-8 pb-20 flex flex-col gap-4 md:gap-6">
      <Suspense fallback={<FaucetLoadingSkeleton />}>
        <Form />
        <History />
      </Suspense>
    </div>
  );
}
