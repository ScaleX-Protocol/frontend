"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
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

  // Loading State
  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border border-[#3A3A3A]">
            <thead className="bg-[#3A3A3A]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider"
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
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-8 h-8 text-[#F06718] animate-spin" />
                    <span className="text-[#A0A0A0] text-sm">{loadingMessage}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border border-[#3A3A3A]">
            <thead className="bg-[#3A3A3A]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider"
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
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div className="text-center">
                      <span className="text-red-400 text-sm font-medium block">{errorMessage}</span>
                      <span className="text-[#A0A0A0] text-xs mt-1 block">
                        {error.message || "Something went wrong"}
                      </span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Empty State
  if (!data || data.length === 0) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border border-[#3A3A3A]">
            <thead className="bg-[#3A3A3A]">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider"
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
            <tbody>
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12"
                >
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-[#3A3A3A] flex items-center justify-center">
                      <Inbox className="w-6 h-6 text-[#A0A0A0]" />
                    </div>
                    <span className="text-[#A0A0A0] text-sm">{emptyMessage}</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Data Table
  return (
    <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border border-[#3A3A3A]">
          <thead className="bg-[#3A3A3A]">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider"
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
          <tbody className="divide-y divide-[#3A3A3A]">
            {table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                className="bg-[#2A2A2A] hover:bg-[#333333] transition-colors"
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className="px-6 py-4 whitespace-nowrap text-sm"
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
    </div>
  );
}
