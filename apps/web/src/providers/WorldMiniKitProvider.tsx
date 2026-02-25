import { MiniKit } from '@worldcoin/minikit-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface WorldMiniKitContextValue {
  isInWorldApp: boolean;
  walletAddress: string | null;
}

const WorldMiniKitContext = createContext<WorldMiniKitContextValue>({
  isInWorldApp: false,
  walletAddress: null,
});

export function WorldMiniKitProvider({ children }: { children: ReactNode }) {
  const [isInWorldApp, setIsInWorldApp] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const appId = import.meta.env.VITE_WORLD_APP_ID as string | undefined;
    if (!appId) return;

    MiniKit.install(appId);

    const installed = MiniKit.isInstalled();
    setIsInWorldApp(installed);

    if (installed && MiniKit.walletAddress) {
      setWalletAddress(MiniKit.walletAddress);
    }
  }, []);

  return (
    <WorldMiniKitContext.Provider value={{ isInWorldApp, walletAddress }}>
      {children}
    </WorldMiniKitContext.Provider>
  );
}

export const useWorldMiniKit = () => useContext(WorldMiniKitContext);
