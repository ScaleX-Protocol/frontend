'use client';

import { cn } from '@/lib/utils';

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export function ToggleSwitch({ 
  checked, 
  onChange, 
  disabled = false,
  className 
}: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={cn(
        "relative w-[52px] h-[28px] rounded-full transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
        checked ? 'bg-[#E26B1D]' : 'bg-[#4A4A4A]',
        className
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] w-[22px] h-[22px] bg-white rounded-full transition-transform duration-200 shadow-md",
          checked ? 'left-[27px]' : 'left-[3px]'
        )}
      />
    </button>
  );
}
