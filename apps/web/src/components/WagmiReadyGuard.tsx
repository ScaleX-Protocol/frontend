'use client';

import { ReactNode, useEffect, useState } from 'react';

/**
 * Guard component that ensures children only render after a brief delay
 * to allow WagmiProvider context to fully initialize.
 *
 * This prevents `useConfig must be used within WagmiProvider` errors
 * that occur when wagmi hooks are called during the initial render
 * before React has fully set up the provider context.
 */
export function WagmiReadyGuard({ children }: { children: ReactNode }) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure provider contexts are fully initialized
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return null;
  }

  return <>{children}</>;
}
