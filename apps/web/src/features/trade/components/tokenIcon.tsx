import { useState, useEffect } from 'react';
import { getTokenIcon } from '@/configs/tokens';

interface TokenIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-6 h-6 text-[10px]',
  md: 'w-8 h-8 text-xs',
  lg: 'w-10 h-10 text-sm',
};

export function TokenIcon({ symbol, size = 'md' }: TokenIconProps) {
  const sizeClass = SIZE_CLASSES[size];
  const [iconPath, setIconPath] = useState(() => getTokenIcon(symbol));
  const [hasError, setHasError] = useState(false);

  // Update icon path when symbol changes
  useEffect(() => {
    setIconPath(getTokenIcon(symbol));
    setHasError(false);
  }, [symbol]);

  const handleError = () => {
    setHasError(true);
  };

  // Fallback to text initials if image fails to load
  if (hasError) {
    return (
      <div className={`${sizeClass} rounded-full flex items-center justify-center bg-[#3A3A3A] text-[#E0E0E0] font-medium`}>
        {symbol.substring(0, 2).toUpperCase()}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center relative overflow-hidden`}>
      <img 
        key={symbol} 
        src={iconPath} 
        alt={`${symbol} icon`} 
        className="w-full h-full object-contain"
        onError={handleError}
      />
    </div>
  );
}

