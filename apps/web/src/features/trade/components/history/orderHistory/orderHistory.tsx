import { DataTable } from "@/features/trade/components/history/dataTable";
import { getOrderHistoryColumns } from "@/features/trade/components/history/orderHistory/column";
import { OrderHistoryCard } from "@/features/trade/components/history/orderHistory/OrderHistoryCard";
import { useWalletState } from '@/hooks/useWalletState';
import { useAllOrders } from "@scalex/api";

interface OrderHistoryProps {
  symbol: string;
  baseDecimals?: number;
  quoteDecimals?: number;
  variant?: 'desktop' | 'mobile';
}

export default function OrderHistory({ 
  symbol,
  baseDecimals = 18,
  quoteDecimals = 6,
  variant = 'desktop' 
}: OrderHistoryProps) {
  const wallet = useWalletState();

  const { data, isLoading, error } = useAllOrders(symbol, wallet.embeddedWallet.address);
  const columns = getOrderHistoryColumns(symbol, baseDecimals, quoteDecimals);

  // Cards variant for mobile
  if (variant === 'mobile') {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-2 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-[#111111] rounded-[12px] p-4 animate-pulse">
              <div className="flex justify-between mb-3">
                <div className="h-5 w-28 bg-[#222222] rounded" />
                <div className="h-4 w-20 bg-[#222222] rounded" />
              </div>
              <div className="flex justify-between mb-3">
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-10 bg-[#222222] rounded" />
                  <div className="h-5 w-20 bg-[#222222] rounded" />
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <div className="h-3 w-10 bg-[#222222] rounded" />
                  <div className="h-5 w-28 bg-[#222222] rounded" />
                </div>
              </div>
              <div className="h-1 w-full bg-[#222222] rounded mb-3" />
              <div className="flex justify-end">
                <div className="h-5 w-16 bg-[#222222] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-8">
          <span className="text-red-400 text-sm text-center">Unable to load order history. Please try again.</span>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <span className="text-[#666666] text-sm text-center">Your order history is empty. Start trading to see your orders here!</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col pb-4">
        {data.map((order) => (
          <OrderHistoryCard
            key={order.orderId}
            order={order}
            baseDecimals={baseDecimals}
            quoteDecimals={quoteDecimals}
          />
        ))}
      </div>
    );
  }

  // Table variant for desktop (default)
  return (
    <DataTable
      columns={columns}
      data={data || []}
      isLoading={isLoading}
      error={error}
      emptyMessage="Your order history is empty. Start trading to see your orders here!"
      loadingMessage="Loading your order history..."
      errorMessage="Unable to load order history. Please try again."
      getRowId={(row) => row.orderId}
    />
  );
}
