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
