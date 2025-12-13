import { WifiOff } from 'lucide-react';
import { memo } from 'react';

interface TradingViewContainerProps {
  height: number | string;
  isReady: boolean;
  error: Error | null;
}

function TradingViewContainer({ height, isReady, error }: TradingViewContainerProps) {
  return (
    <div className="w-full h-full relative" style={{ height }}>
      {/* Loading overlay */}
      {!isReady && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 z-10">
          <div className="text-center">
            <img src={'/images/logo/ScaleX.webp'} alt="logo" className="w-24 h-24" />
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 z-10">
          <div className="text-center px-6">
            <p className="text-red-500 mb-2">Failed to load chart</p>
            <p className="text-sm text-gray-400">{error.message}</p>
          </div>
        </div>
      )}

      {/* TradingView container */}
      <div id="tv_chart_container" className="w-full h-full" />
    </div>
  );
}

export default memo(TradingViewContainer);
