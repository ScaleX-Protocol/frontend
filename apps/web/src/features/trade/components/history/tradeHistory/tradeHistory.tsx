import { DataTable } from "@/features/trade/components/history/dataTable";
import { getTradeHistoryColumns } from "@/features/trade/components/history/tradeHistory/column";
import { useTrades } from "@/features/trade/hooks/history/useTrades";
import { useWalletState } from "@scalex/service-wallet";

interface TradeHistoryProps {
  symbol: string;
  baseDecimals: number;
  quoteDecimals: number;
}

export default function TradeHistory({ symbol, baseDecimals, quoteDecimals }: TradeHistoryProps) {
  const wallet = useWalletState();

  const { data, isLoading, error } = useTrades({
    symbol,
    limit: 10,
    user: wallet.embeddedWallet.address
  });

  const columns = getTradeHistoryColumns(symbol, baseDecimals, quoteDecimals);

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
