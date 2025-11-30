import {
  createColumnHelper,
  type ColumnDef,
  type CellContext,
} from "@tanstack/react-table";
import type { Balance } from "@/features/trade/types/history.types";
import { TokenIcon } from "../../tokenIcon";

const columnHelper = createColumnHelper<Balance>();

export const getBalancesColumns = (totalPortfolioValue: number) => {
  const getAssetPrice = (balance: Balance) => {
    if (balance.total === 0) return 0;
    return balance.usdValue / balance.total;
  };

  return [
    columnHelper.accessor("symbol", {
      id: "asset",
      header: () => "Asset",
      cell: (info: CellContext<Balance, string>) => {
        const balance = info.row.original;
        const assetPrice = getAssetPrice(balance);
        return (
          <div className="flex items-center gap-2">
            <TokenIcon symbol={balance.symbol} />
            <div>
              <div className="text-sm font-medium text-[#E0E0E0]">
                {info.getValue()}
              </div>
              <div className="text-xs text-gray-400">
                $
                {assetPrice.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            </div>
          </div>
        );
      },
      meta: { align: "left" },
    }),
    columnHelper.accessor("available", {
      header: () => <div className="text-right">Available</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono">
          {info.getValue().toLocaleString("en-US", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8,
          })}
        </div>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor("locked", {
      header: () => <div className="text-right">Locked</div>,
      cell: (info) => {
        const hasLockedBalance = info.getValue() > 0;
        return (
          <div
            className={`text-right font-mono ${
              hasLockedBalance ? "text-yellow-400" : "text-gray-500"
            }`}
          >
            {info.getValue().toLocaleString("en-US", {
              minimumFractionDigits: 4,
              maximumFractionDigits: 8,
            })}
          </div>
        );
      },
      meta: { align: "right" },
    }),
    columnHelper.accessor("total", {
      header: () => <div className="text-right">Total</div>,
      cell: (info) => (
        <div className="text-right text-[#E0E0E0] font-mono font-semibold">
          {info.getValue().toLocaleString("en-US", {
            minimumFractionDigits: 4,
            maximumFractionDigits: 8,
          })}
        </div>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor("usdValue", {
      header: () => <div className="text-right">USD Value</div>,
      cell: (info) => (
        <div className="text-right font-mono">
          <span className="text-green-400 font-semibold">
            $
            {info.getValue().toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </span>
        </div>
      ),
      meta: { align: "right" },
    }),
    columnHelper.accessor(
      (row) => {
        const portfolioPercentage =
          totalPortfolioValue > 0
            ? (row.usdValue / totalPortfolioValue) * 100
            : 0;
        return portfolioPercentage;
      },
      {
        id: "portfolioPercentage",
        header: () => <div className="text-right">% of Portfolio</div>,
        cell: (info) => {
          const percentage = info.getValue();
          return (
            <div className="text-right font-mono">
              <div className="flex items-center justify-end gap-2">
                <div className="w-16 bg-[#3A3A3A] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <span className="text-[#E0E0E0] w-12 text-right">
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        },
        meta: { align: "right" },
      }
    ),
  ] as ColumnDef<Balance>[];
};
