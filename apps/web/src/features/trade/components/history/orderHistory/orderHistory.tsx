import { DataTable } from "@/features/trade/components/history/dataTable";
import { getOrderHistoryColumns } from "@/features/trade/components/history/orderHistory/column";
import {
  useAllOrders,
  type UseAllOrdersParams,
} from "@/features/trade/hooks/history/useAllOrders";
import { useWalletState } from "@scalex/service-wallet";

export default function OrderHistory({ symbol }: { symbol: string }) {
  const wallet = useWalletState();

  const params: UseAllOrdersParams = {
    address: wallet.embeddedWallet.address,
    symbol: symbol,
    limit: 10,
  };

  const { data, isLoading, error } = useAllOrders(params);
  const columns = getOrderHistoryColumns(symbol, 18, 6); // baseDecimals, quoteDecimals

  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="No order history"
      loadingMessage="Loading order history..."
      errorMessage="Error loading order history"
      getRowId={(row) => row.orderId}
    />
  );
}
