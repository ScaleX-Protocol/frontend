import { ReactNode } from 'react';
import { PrivyProviders } from './privyProvider';
import { StorageProvider } from './storageProvider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <StorageProvider>
      <PrivyProviders>
        {children}
      </PrivyProviders>
    </StorageProvider>
  );
}
