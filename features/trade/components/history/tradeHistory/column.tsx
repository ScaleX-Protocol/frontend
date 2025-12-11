import {
  createColumnHelper,
  type ColumnDef,
  type CellContext,
} from "@tanstack/react-table";
import type { Trade } from "@/features/trade/types/history.types";
import {
  formatAmount,
  formatPrice,
  formatTime,
} from "@/features/trade/utils/history.helper";

const columnHelper = createColumnHelper<Trade>();

export const getTradeHistoryColumns = (
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
    columnHelper.accessor("isBuyerMaker", {
      id: "type",
      header: () => "Type",
      cell: (info: CellContext<Trade, boolean>) => {
        const isBuy = !info.getValue();
        return (
          <span
            className={`font-semibold ${
              isBuy ? "text-green-400" : "text-red-400"
            }`}
          >
            {isBuy ? "BUY" : "SELL"}
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
    columnHelper.accessor("qty", {
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
        const priceNum = parseFloat(row.price) / 10 ** quoteDecimals;
        const qtyNum = parseFloat(row.qty) / 10 ** baseDecimals;
        return (priceNum * qtyNum).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        });
      },
      {
        id: "total",
        header: () => <div className="text-right">Total</div>,
        cell: (info) => (
          <div className="text-right text-[#E0E0E0] font-mono">
            ${info.getValue()}
          </div>
        ),
        enableSorting: false,
        meta: { align: "right" },
      }
    ),
    columnHelper.accessor("time", {
      header: () => <div className="text-right">Time</div>,
      cell: (info) => (
        <div className="text-right text-gray-400">
          {formatTime(info.getValue())}
        </div>
      ),
      meta: { align: "right" },
    }),
  ] as ColumnDef<Trade>[];
};
