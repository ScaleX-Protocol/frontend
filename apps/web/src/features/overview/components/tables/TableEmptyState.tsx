'use client';

import type { ReactNode } from 'react';

interface TableEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  onAction?: () => void;
  /** 'table' = compact for inside tables, 'card' = full-width card for mobile CTAs */
  variant?: 'table' | 'card';
}

/**
 * Reusable empty state component
 * - 'table' variant: compact styling for inside tables
 * - 'card' variant: full-width card styling for mobile CTAs
 */
export default function TableEmptyState({
  icon,
  title,
  description,
  buttonText,
  onAction,
  variant = 'table',
}: TableEmptyStateProps) {
  if (variant === 'card') {
    return (
      <div className="bg-[#0C0C0C] p-6 rounded-[24px] border border-[#1F1F1F] flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#161616] border border-[#222222] flex items-center justify-center mb-4">
          {icon}
        </div>
        <h3 className="text-[#FFFFFF] font-semibold text-base leading-[24px] mb-2">{title}</h3>
        <p className="text-[#666666] text-xs mb-4 leading-[20px]">{description}</p>
        {buttonText && onAction && (
          <button
            type="button"
            onClick={onAction}
            className="w-full py-3 bg-[#161616] hover:bg-[#1A1A1A] border border-[#333333] rounded-[12px] text-[#FFFFFF] text-xs font-semibold leading-[16px] transition-colors"
          >
            {buttonText}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 gap-4">
      <div className="w-14 h-14 flex items-center justify-center bg-[#111111] rounded-[16px] border border-[#222222]">
        {icon}
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="text-[#FFFFFF] font-medium text-sm leading-[20px]">
          {title}
        </span>
        <span className="text-[#666666] text-xs text-center leading-[19.5px] max-w-[167px]">
          {description}
        </span>
      </div>
      {buttonText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="px-4 py-2 bg-[#161616] hover:bg-[#1A1A1A] text-[#E0E0E0] border border-[#333333] text-xs leading-[16px] font-medium rounded-full transition-colors"
        >
          {buttonText}
        </button>
      )}
    </div>
  );
}
