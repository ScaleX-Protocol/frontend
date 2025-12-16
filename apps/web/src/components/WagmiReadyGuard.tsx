'use client';

import { ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';

/**
 * Guard component that ensures children only render after Privy is ready.
 *
 * This prevents `useConfig must be used within WagmiProvider` errors
 * that occur when wagmi hooks are called before Privy (and its embedded
 * WagmiProvider) are fully initialized.
 *
 * The Privy `ready` state indicates that all authentication providers
 * are initialized, including the WagmiProvider context.
 */
export function WagmiReadyGuard({ children }: { children: ReactNode }) {
  const { ready } = usePrivy();

  // Don't render children until Privy (and WagmiProvider) are ready
  if (!ready) {
    return null;
  }

  return <>{children}</>;
}
