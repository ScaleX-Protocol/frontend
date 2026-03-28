"use client";

import { lazy, Suspense } from "react";
import { useViewMode } from "@/hooks/ui/useViewMode";

// Lazy load view components for performance
const OverviewDesktop = lazy(() => import("./OverviewNew"));
const OverviewMobile = lazy(() => import("./OverviewMobile"));

// Loading skeleton while view loads
function ViewLoadingSkeleton() {
  return (
    <div className="w-full flex-1 p-5 md:p-8 flex flex-col gap-6 animate-pulse">
      <div className="h-8 w-48 bg-[#1A1A1A] rounded-lg" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-[#1A1A1A] rounded-[20px]" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 bg-[#1A1A1A] rounded-[16px]" />
        ))}
      </div>
    </div>
  );
}

/**
 * Overview component - marketplace-style page showing all markets and opportunities
 * Uses React.lazy for lazy loading desktop/mobile views
 */
export default function Overview() {
  const viewMode = useViewMode();

  // Render appropriate view based on viewport
  // For now, both desktop and mobile use the same marketplace view
  // Mobile-specific optimizations can be added later
  return (
    <Suspense fallback={<ViewLoadingSkeleton />}>
      {viewMode === "mobile" ? <OverviewMobile /> : <OverviewDesktop />}
    </Suspense>
  );
}
