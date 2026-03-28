import {
  createRouter,
  createRootRoute,
  createRoute,
  Outlet,
  Navigate,
} from '@tanstack/react-router';
import React, { Suspense } from 'react';
import LoadingScreen from '@/components/LoadingScreen';
import ClientAppLoggerWrapper from '@/components/ClientAppLoggerWrapper';
import { ProvidersWithOnboarding } from '@/providers/ProvidersWithOnboarding';
import AppLayout from '@/components/layout/AppLayout';
import RouteLoadingFallback from '@/components/RouteLoadingFallback';
import { useEffect } from 'react';
import { ChainTypeConfig } from '@/configs/chainType';
import { useMiniKit } from '@coinbase/onchainkit/minikit';

// ── Lazy-loaded page components (route-based code splitting) ────────────
const OverviewPage = React.lazy(() => import('@/pages/overview'));
const PortfolioPage = React.lazy(() => import('@/pages/portfolio'));
const TradePage = React.lazy(() => import('@/pages/trade'));
const LendingPage = React.lazy(() => import('@/pages/lending'));
const FaucetPage = React.lazy(() => import('@/pages/faucet'));
const AgentsPage = React.lazy(() => import('@/pages/agents'));
const AgentDetailPage = React.lazy(() => import('@/pages/agent-detail'));
const MyAgentsPage = React.lazy(() => import('@/pages/my-agents'));
const LeaderboardPage = React.lazy(() => import('@/pages/leaderboard'));
const PredictionsPage = React.lazy(() => import('@/pages/predictions'));

/**
 * Helper that wraps a lazy component with Suspense + loading fallback.
 * Keeps route definitions clean and DRY.
 */
function withSuspense(
  LazyComponent: React.LazyExoticComponent<React.ComponentType>
) {
  return function SuspenseWrapper() {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <LazyComponent />
      </Suspense>
    );
  };
}

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
  path: "/",
  component: () => <Navigate to="/overview" />,
});

// Create overview page route
const overviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/overview",
  component: withSuspense(OverviewPage),
});

// Create portfolio page route
const portfolioRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/portfolio",
  component: withSuspense(PortfolioPage),
});

// Create trade index route (redirects to default pair)
const tradeIndexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trade",
  component: withSuspense(TradePage),
});

// Create trade page route with dynamic pairId
const tradePairRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/trade/$pairId",
  component: withSuspense(TradePage),
});

// Create lending page route
const lendingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/lending",
  component: withSuspense(LendingPage),
});

// Create faucet page route
const faucetRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/faucet",
  component: withSuspense(FaucetPage),
});

// Create agents marketplace route
const agentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agents",
  component: withSuspense(AgentsPage),
});

// Create my agents route (MUST come before agentDetailRoute to avoid matching "my" as a token ID)
const myAgentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agents/my",
  component: withSuspense(MyAgentsPage),
});

// Create agent detail route with dynamic agentTokenId
const agentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/agents/$agentTokenId",
  component: withSuspense(AgentDetailPage),
});

// Create leaderboard route
const leaderboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/leaderboard",
  component: withSuspense(LeaderboardPage),
});

// Create predictions route
const predictionsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/predictions",
  component: withSuspense(PredictionsPage),
});

// Create router
export const router = createRouter({
  routeTree: rootRoute.addChildren([
    indexRoute,
    overviewRoute,
    portfolioRoute,
    tradeIndexRoute,
    tradePairRoute,
    lendingRoute,
    faucetRoute,
    agentsRoute,
    myAgentsRoute,
    agentDetailRoute,
    leaderboardRoute,
    predictionsRoute,
  ]),
});

// Register router for TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
