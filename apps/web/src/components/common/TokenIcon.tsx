import { useState, useEffect } from 'react';
import { getTokenIcon } from '@/configs/tokens';

interface TokenIconProps {
  symbol: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

/**
 * Configurable sizes - easy to extend
 * 
 * Usage:
 *   <TokenIcon symbol="sxUSDC" size="md" />
 *   <TokenIcon symbol="WETH" size="lg" className="mr-2" />
 */
const SIZE_CONFIG = {
  xs: { container: 'w-5 h-5', text: 'text-[8px]' },
  sm: { container: 'w-6 h-6', text: 'text-[10px]' },
  md: { container: 'w-8 h-8', text: 'text-xs' },
  lg: { container: 'w-10 h-10', text: 'text-sm' },
  xl: { container: 'w-12 h-12', text: 'text-base' },
} as const;

/**
 * Get display initials for fallback (strips sx prefix)
 */
const getDisplayInitials = (symbol: string): string => {
  const baseSymbol = symbol.startsWith('sx') ? symbol.substring(2) : symbol;
  return baseSymbol.substring(0, 2).toUpperCase();
};

/**
 * TokenIcon - Unified token icon component
 * 
 * Features:
 * - Automatic fallback to initials on load error
 * - Multiple size options
 * - Handles sx prefix automatically
 * - Customizable via className
 */
export function TokenIcon({ symbol, size = 'md', className = '' }: TokenIconProps) {
  const config = SIZE_CONFIG[size];
  const [iconPath, setIconPath] = useState(() => getTokenIcon(symbol));
  const [hasError, setHasError] = useState(false);

  // Update icon path when symbol changes
  useEffect(() => {
    setIconPath(getTokenIcon(symbol));
    setHasError(false);
  }, [symbol]);

  // Fallback to text initials if image fails to load
  if (hasError) {
    return (
      <div 
        className={`${config.container} ${config.text} rounded-full flex items-center justify-center bg-surface-elevated text-content-secondary font-medium shrink-0 ${className}`}
      >
        {getDisplayInitials(symbol)}
      </div>
    );
  }

  return (
    <div 
      className={`${config.container} rounded-full flex items-center justify-center shrink-0 bg-surface-card overflow-hidden ${className}`}
    >
      <img 
        key={symbol} 
        src={iconPath} 
        alt={`${symbol} icon`} 
        className="h-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

export default TokenIcon;
