import {
  createColumnHelper,
  type ColumnDef,
  type CellContext,
} from "@tanstack/react-table";
import type { Trade } from "@/features/trade/types/history.types";
import {
  calculateFee,
  calculateTotal,
  formatAmount,
  formatPrice,
  formatTime,
} from "@/features/trade/utils/history.helper"; // Your existing helpers

const columnHelper = createColumnHelper<Trade>();

export const getTradeHistoryColumns = (symbol: string) => {
  return [
    columnHelper.display({
      id: "pair",
      header: () => "Pair",
      cell: () => (
        <span className="font-medium text-[#E0E0E0]">
          {symbol.replace("/", " / ")}
        </span>
      ),
      enableSorting: false, // Don't allow sorting on static pair text
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
            <span className="text-gray-400 ml-1 font-normal">/ Market</span>
          </span>
        );
      },
      meta: { align: "left" },
    }),
    columnHelper.accessor("price", {
      header: () => <div className="text-right">Price</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono">
          ${formatPrice(info.getValue())}
        </div>
      ),
      meta: { align: "right" },
      // You can add sorting here:
      // enableSorting: true,
      // sortingFn: 'alphanumeric',
    }),
    columnHelper.accessor("qty", {
      header: () => <div className="text-right">Amount</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono">
          {formatAmount(info.getValue())}
        </div>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor((row) => calculateTotal(row.price, row.qty), {
      id: "total",
      header: () => <div className="text-right">Total</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono">
          ${info.getValue()}
        </div>
      ),
      enableSorting: false, // Calculated field
      meta: { align: "right" },
    }),
    columnHelper.accessor((row) => calculateFee(row.price, row.qty), {
      id: "fee",
      header: () => <div className="text-right">Fee</div>,
      cell: (info) => (
        <div className="text-right text-gray-400 font-mono">
          ${info.getValue()}
        </div>
      ),
      enableSorting: false, // Calculated field
      meta: { align: "right" },
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
  ] as ColumnDef<Trade>[];
};
