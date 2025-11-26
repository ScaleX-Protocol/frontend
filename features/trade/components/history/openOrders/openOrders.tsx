import { DataTable } from "@/features/trade/components/history/dataTable";
import { getOpenOrdersColumns } from "@/features/trade/components/history/openOrders/column";
import {
  useAllOrders,
  type UseAllOrdersParams,
} from "@/features/trade/hooks/history/useAllOrders";
import { useWalletState } from "@/hooks/useWalletState";

export default function OpenOrders({ symbol }: { symbol: string }) {
  const wallet = useWalletState();

  const params: UseAllOrdersParams = {
    address: wallet.embeddedWallet.address,
    symbol: symbol,
    limit: 10,
  };

  const { data, isLoading, error } = useAllOrders(params);
  const columns = getOpenOrdersColumns(symbol, 18, 6); // baseDecimals, quoteDecimals

  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="No orders found"
      loadingMessage="Loading orders..."
      errorMessage="Error loading orders"
      getRowId={(row) => row.orderId}
    />
  );
}
