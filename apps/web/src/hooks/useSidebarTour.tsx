import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

const TOUR_COMPLETED_KEY = 'scalex_sidebar_tour_completed';

export interface TourStep {
  label: string;
  description: string;
  path: string | null; // null = no navigation (welcome step)
}

export const TOUR_STEPS: TourStep[] = [
  {
    label: 'Welcome',
    description: "Welcome to ScaleX! Let's take a quick tour of the platform.",
    path: null,
  },
  {
    label: 'Overview',
    description: 'Your dashboard - see market data, lending pools, predictions, and top agents all in one place.',
    path: '/overview',
  },
  {
    label: 'Portfolio',
    description: 'View your assets, deposit or withdraw funds, track your P&L, and monitor all positions.',
    path: '/portfolio',
  },
  {
    label: 'Trade',
    description: 'Place market and limit orders, view real-time charts and order books for any trading pair.',
    path: '/trade',
  },
  {
    label: 'Lending',
    description: 'Supply assets to earn yield or borrow against your collateral with health monitoring.',
    path: '/lending',
  },
  {
    label: 'Predictions',
    description: 'Access prediction markets - take positions on outcomes and manage your bets.',
    path: '/predictions',
  },
  {
    label: 'Agents',
    description: 'Browse AI trading agents, authorize them to trade for you, or register your own agent.',
    path: '/agents',
  },
  {
    label: 'Leaderboard',
    description: 'See top performers ranked by PnL, volume, and win rate - both users and agents.',
    path: '/leaderboard',
  },
  {
    label: 'Faucet',
    description: 'Request free test tokens to try out all platform features risk-free.',
    path: '/faucet',
  },
];

interface SidebarTourContextType {
  isTourActive: boolean;
  currentStep: number;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  hasCompletedTour: boolean;
}

const SidebarTourContext = createContext<SidebarTourContextType | undefined>(undefined);

export function SidebarTourProvider({ children }: { children: ReactNode }) {
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // default true to prevent flash

  useEffect(() => {
    const completed = localStorage.getItem(TOUR_COMPLETED_KEY);
    setHasCompletedTour(completed === 'true');
  }, []);

  // Auto-start tour on first visit (desktop only)
  useEffect(() => {
    if (hasCompletedTour) return;
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return;

    // Small delay to let the app render first
    const timer = setTimeout(() => {
      setIsTourActive(true);
      setCurrentStep(0);
    }, 800);
    return () => clearTimeout(timer);
  }, [hasCompletedTour]);

  const startTour = useCallback(() => {
    const isDesktop = window.innerWidth >= 768;
    if (!isDesktop) return;
    setCurrentStep(0);
    setIsTourActive(true);
  }, []);

  const completeTour = useCallback(() => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setHasCompletedTour(true);
    setIsTourActive(false);
    setCurrentStep(0);
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => {
      if (prev >= TOUR_STEPS.length - 1) {
        completeTour();
        return 0;
      }
      return prev + 1;
    });
  }, [completeTour]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
  }, [completeTour]);

  return (
    <SidebarTourContext.Provider
      value={{
        isTourActive,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        hasCompletedTour,
      }}
    >
      {children}
    </SidebarTourContext.Provider>
  );
}

export function useSidebarTour(): SidebarTourContextType {
  const context = useContext(SidebarTourContext);
  if (!context) throw new Error('useSidebarTour must be used within a SidebarTourProvider');
  return context;
}
