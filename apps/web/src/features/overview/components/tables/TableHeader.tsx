'use client';

interface TableHeaderColumn {
  label: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface TableHeaderProps {
  columns: TableHeaderColumn[];
}

/**
 * Reusable table header component
 * Provides consistent styling for table headers across all table variants
 */
export default function TableHeader({ columns }: TableHeaderProps) {
  const getAlignmentClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  };

  return (
    <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F]">
      {columns.map((column, index) => (
        <div
          key={`${column.label}-${index}`}
          className={`flex-1 text-[#555555] text-xs leading-[16px] font-semibold uppercase tracking-wide ${getAlignmentClass(column.align)} ${column.className || ''}`}
        >
          {column.label}
        </div>
      ))}
    </div>
  );
}
