import { createRouter, createRootRoute, createRoute, Outlet, Navigate } from '@tanstack/react-router';
import LoadingScreen from '@/components/LoadingScreen';
import ClientAppLoggerWrapper from '@/components/ClientAppLoggerWrapper';
import { ProvidersWithOnboarding } from '@/providers/ProvidersWithOnboarding';
import AppLayout from '@/components/layout/AppLayout';
import OverviewPage from '@/pages/overview';
import TradePage from '@/pages/trade';
import LendingPage from '@/pages/lending';
import FaucetPage from '@/pages/faucet';
import { useEffect } from 'react';
import { ChainTypeConfig } from '@/configs/chainType';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

// MiniKit setup — only runs in EVM mode where MiniKitProvider is available
// ChainTypeConfig is evaluated at build time, so this is safe to guard
function useMiniKitSetup() {
  if (ChainTypeConfig.isEVM) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const { setMiniAppReady, isMiniAppReady } = useMiniKit();
    return { setMiniAppReady, isMiniAppReady };
  }
  // Solana mode: no MiniKit — return no-ops
  return { setMiniAppReady: () => { }, isMiniAppReady: true };
}

// Root layout component
const RootComponent = () => {
  const { setMiniAppReady, isMiniAppReady } = useMiniKitSetup();

  useEffect(() => {
    if (!isMiniAppReady) {
      setMiniAppReady();
    }
  }, [setMiniAppReady, isMiniAppReady]);

  return (
    <div className="w-full min-h-screen bg-[#050505] text-[#E0E0E0]">
      <LoadingScreen />
      <ClientAppLoggerWrapper>
        <ProvidersWithOnboarding>
          <AppLayout>
            <Outlet />
          </AppLayout>
        </ProvidersWithOnboarding>
      </ClientAppLoggerWrapper>
    </div>
  );
};

// Create root route
const rootRoute = createRootRoute({
  component: RootComponent,
});

// Create index route with redirect to overview
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/overview" />,
});

// Create overview page route
const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/overview',
  component: OverviewPage,
});

// Create trade index route (redirects to default pair)
const tradeIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade',
  component: TradePage,
});

// Create trade page route with dynamic pairId
const tradePairRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade/$pairId',
  component: TradePage,
});

// Create lending page route
const lendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/lending',
  component: LendingPage,
});

// Create faucet page route
const faucetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faucet',
  component: FaucetPage,
});

// Create router
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    overviewRoute,
    tradeIndexRoute,
    tradePairRoute,
    lendingRoute,
    faucetRoute,
  ]),
});

// Register router for TypeScript
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}