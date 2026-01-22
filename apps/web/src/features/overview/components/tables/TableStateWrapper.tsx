'use client';

import type { ReactNode } from 'react';
import TableHeader from './TableHeader';
import TableEmptyState from './TableEmptyState';

interface TableHeaderColumn {
  label: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface EmptyStateConfig {
  icon: ReactNode;
  title: string;
  description: string;
  buttonText?: string;
  onAction?: () => void;
}

interface TableStateWrapperProps {
  isLoading: boolean;
  error: Error | null;
  isEmpty: boolean;
  columns: TableHeaderColumn[];
  emptyConfig: EmptyStateConfig;
  loadingText?: string;
  children: ReactNode;
}

/**
 * Wrapper component that handles loading, error, and empty states for tables
 * Use this to reduce boilerplate in all table components
 */
export default function TableStateWrapper({
  isLoading,
  error,
  isEmpty,
  columns,
  emptyConfig,
  loadingText = 'Loading...',
  children,
}: TableStateWrapperProps) {
  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col rounded-lg overflow-hidden">
        <TableHeader columns={columns} />
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-6 h-6 border-2 border-[#252525] border-t-[#606060] rounded-full animate-spin" />
          <span className="text-[#505050] text-sm">{loadingText}</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex flex-col rounded-lg overflow-hidden">
        <TableHeader columns={columns} />
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
            <svg
              className="w-5 h-5 text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-[#E0E0E0] font-medium text-sm">Failed to load data</span>
          <span className="text-[#404040] text-xs">{error.message}</span>
        </div>
      </div>
    );
  }

  // Empty state
  if (isEmpty) {
    return (
      <div className="flex flex-col rounded-lg overflow-hidden">
        <TableHeader columns={columns} />
        <TableEmptyState {...emptyConfig} />
      </div>
    );
  }

  // Data state - render children
  return (
    <div className="flex flex-col rounded-lg overflow-hidden">
      <TableHeader columns={columns} />
      <div className="flex flex-col">{children}</div>
    </div>
  );
}
