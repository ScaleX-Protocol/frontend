import { DataTable } from "@/features/trade/components/history/dataTable";
import { getTradeHistoryColumns } from "@/features/trade/components/history/tradeHistory/column";
import { useTrades } from "@/features/trade/hooks/history/useTrades";

export default function TradeHistory({ symbol }: { symbol: string }) {
  const { data, isLoading, error } = useTrades({ symbol, limit: 10 });
  const columns = getTradeHistoryColumns(symbol);

  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="No trade history found"
      loadingMessage="Loading trade history..."
      errorMessage="Error loading trade history"
      getRowId={(row) => row.id}
    />
  );
}
