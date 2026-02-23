import { DataTable } from "@/features/trade/components/history/dataTable";
import { getOpenOrdersColumns } from "@/features/trade/components/history/openOrders/column";
import { OpenOrderCard } from "@/features/trade/components/history/openOrders/OpenOrderCard";
import { useWalletState } from '@/hooks/useWalletState';
import { useOpenOrders } from '@scalex/api';

interface OpenOrdersProps {
  symbol: string;
  baseDecimals?: number;
  quoteDecimals?: number;
  variant?: 'desktop' | 'mobile';
}

export default function OpenOrders({ 
  symbol, 
  baseDecimals = 18,
  quoteDecimals = 6,
  variant = 'desktop' 
}: OpenOrdersProps) {
  const wallet = useWalletState();

  const { data, isLoading, error } = useOpenOrders(symbol, wallet.embeddedWallet.address);
  const columns = getOpenOrdersColumns(symbol, baseDecimals, quoteDecimals);

  // Handle modify action
  const handleModify = (order: any) => {
    // TODO: Implement modify order functionality
    console.log('Modify order:', order);
  };

  // Handle cancel action
  const handleCancel = (order: any) => {
    // TODO: Implement cancel order functionality
    console.log('Cancel order:', order);
  };

  // Cards variant for mobile
  if (variant === 'mobile') {
    if (isLoading) {
      return (
        <div className="flex flex-col gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={`skeleton-${i}`} className="bg-[#0A0A0A] rounded-lg p-4 animate-pulse">
              <div className="flex justify-between mb-2">
                <div className="h-4 w-24 bg-[#222222] rounded" />
                <div className="h-3 w-16 bg-[#222222] rounded" />
              </div>
              <div className="flex gap-6 mb-3">
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-10 bg-[#222222] rounded" />
                  <div className="h-4 w-20 bg-[#222222] rounded" />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-10 bg-[#222222] rounded" />
                  <div className="h-4 w-24 bg-[#222222] rounded" />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <div className="h-4 w-12 bg-[#222222] rounded" />
                <div className="h-4 w-12 bg-[#222222] rounded" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center p-8">
          <span className="text-red-400 text-sm text-center">Unable to load open orders. Please try again.</span>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="flex items-center justify-center p-8">
          <span className="text-[#666666] text-sm text-center">No open orders yet. Place your first order to start trading!</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-3">
        {data.map((order) => (
          <OpenOrderCard
            key={order.orderId}
            order={order}
            baseDecimals={baseDecimals}
            quoteDecimals={quoteDecimals}
            onModify={handleModify}
            onCancel={handleCancel}
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
      emptyMessage="No open orders yet. Place your first order to start trading!"
      loadingMessage="Fetching your open orders..."
      errorMessage="Unable to load open orders. Please try again."
      getRowId={(row) => row.orderId}
    />
  );
}
