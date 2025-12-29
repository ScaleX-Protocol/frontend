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
      emptyMessage="No open orders yet. Place your first order to start trading!"
      loadingMessage="Fetching your open orders..."
      errorMessage="Unable to load open orders. Please try again."
      getRowId={(row) => row.orderId}
    />
  );
}
