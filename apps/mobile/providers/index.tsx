import { ReactNode, useEffect } from 'react';
// import { PrivyProviders } from './privyProvider'; // Temporarily disabled - jose library incompatible with RN
import { StorageProvider } from './storageProvider';
import { initializeApiClients } from '../src/config/api';

export function Providers({ children }: { children: ReactNode }) {
  // Initialize API clients on mount
  useEffect(() => {
    initializeApiClients();
  }, []);

  return (
    <StorageProvider>
      {children}
    </StorageProvider>
  );
}
