import { DataTable } from "@/features/trade/components/history/dataTable";
import { getTradeHistoryColumns } from "@/features/trade/components/history/tradeHistory/column";
import { useTrades } from "@scalex/api";
import { useWalletState } from "@scalex/service-wallet";

interface TradeHistoryProps {
  symbol: string;
  baseDecimals: number;
  quoteDecimals: number;
}

export default function TradeHistory({ symbol, baseDecimals, quoteDecimals }: TradeHistoryProps) {
  const wallet = useWalletState();

  const { data, isLoading, error } = useTrades(symbol, 10);

  const columns = getTradeHistoryColumns(symbol, baseDecimals, quoteDecimals);

  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="No trades yet. Execute your first trade to see your history!"
      loadingMessage="Loading your trade history..."
      errorMessage="Unable to load trade history. Please try again."
      getRowId={(row) => row.id}
    />
  );
}
