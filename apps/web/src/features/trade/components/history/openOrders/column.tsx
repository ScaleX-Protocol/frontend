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

export const getOpenOrdersColumns = (
  symbol: string,
  baseDecimals: number = 18,
  quoteDecimals: number = 6
) => {
  return [
    // Time - First column
    columnHelper.accessor("time", {
      id: "time",
      header: () => <div className="text-left">Time</div>,
      cell: (info) => (
        <span className="text-[#888888] text-xs leading-[16px]">
          {formatTime(info.getValue())}
        </span>
      ),
      meta: { align: "left" },
    }),
    // Type - Limit Buy / Limit Sell
    columnHelper.accessor("side", {
      id: "type",
      header: () => <div className="text-left">Type</div>,
      cell: (info: CellContext<Order, string>) => {
        const isBuy = info.row.original.side === "BUY";
        const orderType = info.row.original.type?.toLowerCase() || "limit";
        const typeText = `${orderType.charAt(0).toUpperCase() + orderType.slice(1)} ${isBuy ? "Buy" : "Sell"}`;
        return (
          <span
            className={`text-xs leading-[16px] font-medium ${
              isBuy ? "text-[#22C55E]" : "text-[#F87171]"
            }`}
          >
            {typeText}
          </span>
        );
      },
      meta: { align: "left" },
    }),
    // Price
    columnHelper.accessor("price", {
      header: () => <div className="text-center">Price</div>,
      cell: (info) => (
        <span className="text-[#888888] text-xs leading-[16px]">
          {formatPrice(info.getValue(), quoteDecimals)}
        </span>
      ),
      meta: { align: "center" },
    }),
    // Amount
    columnHelper.accessor("origQty", {
      header: () => <div className="text-center">Amount</div>,
      cell: (info) => (
        <span className="text-[#888888] text-xs leading-[16px]">
          {formatAmount(info.getValue(), baseDecimals)}
        </span>
      ),
      meta: { align: "center" },
    }),
    // Filled - Shows amount and percentage
    columnHelper.accessor(
      (row) => {
        const filledPercentage =
          (parseFloat(row.executedQty) / parseFloat(row.origQty)) * 100;
        return { executedQty: row.executedQty, percentage: filledPercentage };
      },
      {
        id: "filled",
        header: () => <div className="text-center">Filled</div>,
        cell: (info) => {
          const { executedQty, percentage } = info.getValue();
          // Color logic: 0% = green, partial = yellow/orange
          const percentageColor = 
            percentage === 0 ? "text-[#22C55E]" : 
            percentage === 100 ? "text-[#22C55E]" : 
            "text-[#FBBF24]";
          
          return (
            <div className="flex items-center justify-center gap-2">
              <span className="text-[#888888] text-xs leading-[16px]">
                {formatAmount(executedQty, 18)}
              </span>
              <span className={`text-xs leading-[16px] ${percentageColor}`}>
                ({percentage.toFixed(0)}%)
              </span>
            </div>
          );
        },
        meta: { align: "center" },
      }
    ),
    // Status - Badge style
    columnHelper.accessor("status", {
      header: () => <div className="text-right">Status</div>,
      cell: (info) => {
        const status = info.getValue();
        
        // Determine badge style and label
        const getStatusConfig = (status: string) => {
          switch (status) {
            case "FILLED":
              return {
                label: "Filled",
                className: "border-[#22C55E] text-[#22C55E]"
              };
            case "PARTIALLY_FILLED":
              return {
                label: "Partially Filled",
                className: "border-[#888888] text-[#888888]"
              };
            case "NEW":
              return {
                label: "Open",
                className: "border-[#888888] text-[#888888]"
              };
            case "CANCELED":
              return {
                label: "Cancelled",
                className: "border-[#666666] text-[#666666]"
              };
            default:
              return {
                label: status,
                className: "border-[#888888] text-[#888888]"
              };
          }
        };
        
        const config = getStatusConfig(status);
        
        return (
          <div className="flex justify-end">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] leading-[14px] font-medium border ${config.className} bg-transparent`}
            >
              {config.label}
            </span>
          </div>
        );
      },
      meta: { align: "right" },
    }),
  ] as ColumnDef<Order>[];
};

