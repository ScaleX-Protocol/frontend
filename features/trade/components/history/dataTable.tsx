"use client";

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from "@tanstack/react-table";

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

  if (isLoading) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-[#E0E0E0] text-sm">{loadingMessage}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400 text-sm">{errorMessage}</div>
        </div>
      </div>
    );
  }

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
                          header.column.columnDef.meta?.align === "right"
                            ? "right"
                            : header.column.columnDef.meta?.align === "center"
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
                  className="px-6 py-12 text-center text-sm text-gray-400"
                >
                  {emptyMessage}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

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
                        header.column.columnDef.meta?.align === "right"
                          ? "right"
                          : header.column.columnDef.meta?.align === "center"
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
                        cell.column.columnDef.meta?.align === "right"
                          ? "right"
                          : cell.column.columnDef.meta?.align === "center"
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
