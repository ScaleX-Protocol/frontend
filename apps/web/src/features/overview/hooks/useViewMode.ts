'use client';

import { useState, useEffect } from 'react';

/**
 * Breakpoint values (in pixels)
 * Single source of truth for responsive design
 */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type ViewMode = 'mobile' | 'tablet' | 'desktop';

/**
 * SSR-safe hook for detecting current viewport mode
 * Uses debounced resize listener for performance
 */
export function useViewMode(): ViewMode {
  // Default to desktop for SSR
  const [viewMode, setViewMode] = useState<ViewMode>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.tablet) {
        setViewMode('mobile');
      } else if (width < BREAKPOINTS.desktop) {
        setViewMode('tablet');
      } else {
        setViewMode('desktop');
      }
    };

    // Initial check
    handleResize();

    // Debounced resize listener
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 100);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return viewMode;
}

/**
 * Utility to check if current view is mobile
 */
export function useIsMobile(): boolean {
  const viewMode = useViewMode();
  return viewMode === 'mobile';
}

/**
 * Utility to check if current view is desktop
 */
export function useIsDesktop(): boolean {
  const viewMode = useViewMode();
  return viewMode === 'desktop';
}
