import { useState, useEffect } from 'react';
import { getTokenIcon } from '@/configs/tokens';

interface TokenIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg';
}

const SIZE_CLASSES = {
  sm: 'w-7 h-7 text-[10px]',
  md: 'w-9 h-9 text-xs',
  lg: 'w-12 h-12 text-sm',
};

// Get display initials for fallback (strip sx prefix)
const getDisplayInitials = (symbol: string): string => {
  const baseSymbol = symbol.startsWith('sx') ? symbol.substring(2) : symbol;
  return baseSymbol.substring(0, 2).toUpperCase();
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
      <div className={`${sizeClass} rounded-full flex items-center justify-center bg-[#3A3A3A] text-[#E0E0E0] font-medium shrink-0`}>
        {getDisplayInitials(symbol)}
      </div>
    );
  }

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center shrink-0 bg-[#2A2A2A]`}>
      <img 
        key={symbol} 
        src={iconPath} 
        alt={`${symbol} icon`} 
        className="w-full h-full object-cover rounded-full"
        onError={handleError}
      />
    </div>
  );
}

