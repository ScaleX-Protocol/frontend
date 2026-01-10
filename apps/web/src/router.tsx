import { createRouter, createRootRoute, createRoute, Outlet, Navigate, useParams } from '@tanstack/react-router';
import LoadingScreen from '@/components/LoadingScreen';
import ClientAppLoggerWrapper from '@/components/ClientAppLoggerWrapper';
import { ProvidersWithOnboarding } from '@/providers/ProvidersWithOnboarding';
import AppLayout from '@/components/layout/AppLayout';
import HomePage from '@/pages/home';
import TradePage from '@/pages/trade';
import LendingPage from '@/pages/lending';
import FaucetPage from '@/pages/faucet';

// Root layout component
const RootComponent = () => {
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
    homeRoute,
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