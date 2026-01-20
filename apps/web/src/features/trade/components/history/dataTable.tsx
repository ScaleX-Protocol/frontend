"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
  type Table,
  type HeaderGroup,
} from "@tanstack/react-table";
import { Loader2, AlertCircle, Inbox } from "lucide-react";

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  loadingMessage?: string;
  errorMessage?: string;
  getRowId?: (row: TData) => string;
}

// Shared table header component for consistent styling
function TableHeader<TData>({ 
  headerGroups 
}: { 
  headerGroups: HeaderGroup<TData>[] 
}) {
  return (
    <thead>
      {headerGroups.map((headerGroup) => (
        <tr key={headerGroup.id} className="bg-[#0F0F0F] border-b border-[#1F1F1F]">
          {headerGroup.headers.map((header) => (
            <th
              key={header.id}
              className="px-4 py-3 text-[10px] leading-[15px] font-medium text-[#555555] uppercase tracking-wider"
              style={{
                textAlign:
                  (header.column.columnDef.meta as any)?.align === "right"
                    ? "right"
                    : (header.column.columnDef.meta as any)?.align === "center"
                    ? "center"
                    : "left",
              }}
            >
              {header.isPlaceholder
                ? null
                : flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
            </th>
          ))}
        </tr>
      ))}
    </thead>
  );
}

// Reusable component for loading, error, and empty states
interface TableStateContentProps {
  type: 'loading' | 'error' | 'empty';
  message: string;
  errorDetail?: string;
  colSpan: number;
}

function TableStateContent({ type, message, errorDetail, colSpan }: TableStateContentProps) {
  return (
    <tbody>
      <tr>
        <td colSpan={colSpan} className="px-4 py-12">
          <div className="flex flex-col items-center justify-center gap-3">
            {type === 'loading' && (
              <>
                <Loader2 className="w-6 h-6 text-[#F06718] animate-spin" />
                <span className="text-[#555555] text-xs">{message}</span>
              </>
            )}
            {type === 'error' && (
              <>
                <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div className="text-center">
                  <span className="text-red-400 text-xs font-medium block">{message}</span>
                  {errorDetail && (
                    <span className="text-[#555555] text-[10px] mt-1 block">
                      {errorDetail}
                    </span>
                  )}
                </div>
              </>
            )}
            {type === 'empty' && (
              <>
                <div className="w-10 h-10 rounded-full bg-[#1F1F1F] flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-[#555555]" />
                </div>
                <span className="text-[#555555] text-xs">{message}</span>
              </>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  error = null,
  emptyMessage = "No data found",
  loadingMessage = "Loading...",
  errorMessage = "Error loading data",
  getRowId,
}: DataTableProps<TData>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getRowId,
  });

  const headerGroups = table.getHeaderGroups();

  // Loading State
  if (isLoading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader headerGroups={headerGroups} />
          <TableStateContent 
            type="loading" 
            message={loadingMessage} 
            colSpan={columns.length} 
          />
        </table>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader headerGroups={headerGroups} />
          <TableStateContent 
            type="error" 
            message={errorMessage} 
            errorDetail={error.message || "Something went wrong"}
            colSpan={columns.length} 
          />
        </table>
      </div>
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader headerGroups={headerGroups} />
          <TableStateContent 
            type="empty" 
            message={emptyMessage} 
            colSpan={columns.length} 
          />
        </table>
      </div>
    );
  }

  // Data Table
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <TableHeader headerGroups={headerGroups} />
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-[#111111] transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td
                  key={cell.id}
                  className="px-4 py-4 whitespace-nowrap text-xs leading-[16px]"
                  style={{
                    textAlign:
                      (cell.column.columnDef.meta as any)?.align === "right"
                        ? "right"
                        : (cell.column.columnDef.meta as any)?.align === "center"
                        ? "center"
                        : "left",
                  }}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
