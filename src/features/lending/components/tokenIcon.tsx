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
  const iconPath = getTokenIcon(symbol);

  return (
    <div className={`${sizeClass} rounded-full flex items-center justify-center relative overflow-hidden`}>
      <img src={iconPath} alt="Token Icon" className="w-full h-full object-contain" />
    </div>
  );
}
