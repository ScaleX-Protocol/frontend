import { DataTable } from "@/features/trade/components/history/dataTable";
import { getOpenOrdersColumns } from "@/features/trade/components/history/openOrders/column";
import {
  useOpenOrders,
  type UseOpenOrdersParams,
} from "@/features/trade/hooks/history/useOpenOrders";
import { useWalletState } from "@scalex/service-wallet";

export default function OpenOrders({ symbol }: { symbol: string }) {
  const wallet = useWalletState();

  const params: UseOpenOrdersParams = {
    address: wallet.embeddedWallet.address,
    symbol: symbol,
    limit: 10,
  };

  const { data, isLoading, error } = useOpenOrders(params);
  const columns = getOpenOrdersColumns(symbol, 18, 6); // baseDecimals, quoteDecimals

  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="No open orders"
      loadingMessage="Loading open orders..."
      errorMessage="Error loading open orders"
      getRowId={(row) => row.orderId}
    />
  );
}
