import {
  createColumnHelper,
  type ColumnDef,
  type CellContext,
} from "@tanstack/react-table";
import type { Order } from "@/features/trade/types/history.types";
import {
  formatAmount,
  formatPrice,
  formatTime,
} from "@/features/trade/utils/history.helper";

const columnHelper = createColumnHelper<Order>();

export const getOrderHistoryColumns = (
  symbol: string,
  baseDecimals: number = 18,
  quoteDecimals: number = 6
) => {
  return [
    columnHelper.display({
      id: "pair",
      header: () => "Pair",
      cell: () => (
        <span className="font-medium text-[#E0E0E0]">
          {symbol.replace("/", " / ")}
        </span>
      ),
      enableSorting: false,
      meta: { align: "left" },
    }),
    columnHelper.accessor("side", {
      id: "type",
      header: () => "Type",
      cell: (info: CellContext<Order, string>) => {
        const isBuy = info.row.original.side === "BUY";
        const orderType = info.row.original.type;
        return (
          <span>
            <span
              className={`font-semibold ${
                isBuy ? "text-green-400" : "text-red-400"
              }`}
            >
              {info.getValue()}
            </span>
            <span className="text-gray-400 ml-1">/ {orderType}</span>
          </span>
        );
      },
      meta: { align: "left" },
    }),
    columnHelper.accessor("price", {
      header: () => <div className="text-right">Price</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono">
          ${formatPrice(info.getValue(), quoteDecimals)}
        </div>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor("origQty", {
      header: () => <div className="text-right">Amount</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono">
          {formatAmount(info.getValue(), baseDecimals)}
        </div>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor(
      (row) => {
        const filledPercentage =
          (parseFloat(row.executedQty) / parseFloat(row.origQty)) * 100;
        return { executedQty: row.executedQty, percentage: filledPercentage };
      },
      {
        id: "filled",
        header: () => <div className="text-right">Filled</div>,
        cell: (info) => {
          const { executedQty, percentage } = info.getValue();
          return (
            <div className="text-right font-mono">
              <div className="flex items-center justify-end gap-2">
                <span className="text-[#E0E0E0]">
                  {formatAmount(executedQty, baseDecimals)}
                </span>
                <span
                  className={`text-xs ${
                    percentage === 100 ? "text-green-400" : "text-yellow-400"
                  }`}
                >
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            </div>
          );
        },
        meta: { align: "right" },
      }
    ),
    columnHelper.accessor("cumulativeQuoteQty", {
      header: () => <div className="text-right">Total</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono">
          ${formatPrice(info.getValue(), baseDecimals)}
        </div>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor("status", {
      header: () => <div className="text-center">Status</div>,
      cell: (info) => {
        const status = info.getValue();
        const statusStyles = {
          FILLED: "bg-green-900/30 text-green-400 border border-green-400/30",
          PARTIALLY_FILLED:
            "bg-yellow-900/30 text-yellow-400 border border-yellow-400/30",
          NEW: "bg-blue-900/30 text-blue-400 border border-blue-400/30",
          CANCELED: "bg-gray-900/30 text-gray-400 border border-gray-400/30",
        };
        const styleClass =
          statusStyles[status as keyof typeof statusStyles] ||
          "bg-blue-900/30 text-blue-400 border border-blue-400/30";
        return (
          <div className="text-center">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styleClass}`}
            >
              {status}
            </span>
          </div>
        );
      },
      meta: { align: "center" },
    }),
    columnHelper.accessor("time", {
      header: () => <div className="text-right">Time</div>,
      cell: (info) => (
        <div className="text-right text-gray-400">
          {formatTime(info.getValue())}
        </div>
      ),
      meta: { align: "right" },
    }),
  ] as ColumnDef<Order>[];
};
