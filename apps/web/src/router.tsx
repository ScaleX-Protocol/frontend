import { createRouter, createRootRoute, createRoute, Outlet, Navigate } from '@tanstack/react-router';
import LoadingScreen from '@/components/LoadingScreen';
import ClientAppLoggerWrapper from '@/components/ClientAppLoggerWrapper';
import { ProvidersWithOnboarding } from '@/providers/ProvidersWithOnboarding';
import { WagmiReadyGuard } from '@/components/WagmiReadyGuard';
import HomePage from '@/pages/home';
import TradePage from '@/pages/trade';
import LendingPage from '@/pages/lending';
import FaucetPage from '@/pages/faucet';

// Root layout component
const RootComponent = () => {
  return (
    <div className="w-full h-screen bg-black text-[#E0E0E0]">
      <LoadingScreen />
      <ClientAppLoggerWrapper>
        <ProvidersWithOnboarding>
          <WagmiReadyGuard>
            <Outlet />
          </WagmiReadyGuard>
        </ProvidersWithOnboarding>
      </ClientAppLoggerWrapper>
    </div>
  );
};

// Create root route
const rootRoute = createRootRoute({
  component: RootComponent,
});

// Create home route with redirect
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <Navigate to="/home" />,
});

// Create home page route
const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/home',
  component: HomePage,
});

// Create trade page route
const tradeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/trade',
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
    homeRoute,
    tradeRoute,
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