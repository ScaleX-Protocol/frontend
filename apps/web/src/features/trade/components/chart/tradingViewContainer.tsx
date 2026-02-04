import { memo, useState, useEffect } from 'react';

interface TradingViewContainerProps {
  height: number | string;
  isReady: boolean;
  error: Error | null;
}

// Delay before rendering the container (in ms)
// This helps prevent crashes in WebView environments like Base App
const RENDER_DELAY_MS = 1000;

function TradingViewContainer({ height, isReady, error }: TradingViewContainerProps) {
  const [shouldRenderContainer, setShouldRenderContainer] = useState(false);

  // Lazy render: delay rendering the container to give WebView time to stabilize
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldRenderContainer(true);
    }, RENDER_DELAY_MS);

    return () => clearTimeout(timer);
  }, []);

  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  // Show loading while waiting to render
  if (!shouldRenderContainer) {
    return (
      <div className="w-full h-full relative flex items-center justify-center bg-[#0A0A0A]" style={{ height }}>
        <div className="text-center">
          <img src={'/images/logo/ScaleX.webp'} alt="logo" className="w-16 h-16 animate-pulse" />
          <p className="text-[#666666] text-xs mt-2">Loading chart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative" style={{ height }}>
      {/* Loading overlay */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="text-center">
            <img src={'/images/logo/ScaleX.webp'} alt="logo" className="w-24 h-24" />
          </div>
        </div>
      )}

      {/* TradingView container */}
      <div id="tv_chart_container" className="w-full h-full" />
    </div>
  );
}

export default memo(TradingViewContainer);
