import { memo } from 'react';

interface TradingViewContainerProps {
  height: number | string;
  isReady: boolean;
  error: Error | null;
}

function TradingViewContainer({ height, isReady, error }: TradingViewContainerProps) {
  // Throw error to be caught by error boundary
  if (error) {
    throw error;
  }

  return (
    <div className="w-full h-full relative" style={{ height }}>
      {/* Loading overlay - shown while widget is initializing */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0A0A0A] z-10">
          <div className="text-center">
            <img src={'/images/logo/ScaleX-Logo.png'} alt="logo" className="w-16 h-16 animate-pulse" />
            {/* <p className="text-[#666666] text-xs mt-2">Loading chart...</p> */}
          </div>
        </div>
      )}

      {/* TradingView container - always rendered so widget can attach to it */}
      <div id="tv_chart_container" className="w-full h-full" />
    </div>
  );
}

export default memo(TradingViewContainer);
