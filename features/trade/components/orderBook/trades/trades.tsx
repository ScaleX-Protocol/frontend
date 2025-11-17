import { useTrades, type UseTradesParams } from '@/features/trade/hooks/history/useTrades';
import { useWalletState } from '@/hooks/useWalletState';

export default function Trades({ symbol }: { symbol: string }) {
  const wallet = useWalletState();
  
  const params: UseTradesParams = {
    symbol: symbol,
    limit: 10,
    user: wallet.embeddedWallet.address,
    orderBy: 'asc',
  };
  
  const { data, isLoading, error } = useTrades(params);

  if (isLoading || error || !data) return;

  console.log(data);

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-3 py-2 text-sm text-[#E0E0E0] border-b border-[#E0E0E0]/20">
        <div>Price</div>
        <div className="ml-4">Size</div>
        <div className="text-right">Time</div>
      </div>
      <div className="h-full max-h-[373px] overflow-y-auto no-scrollbar"></div>
    </div>
  );
}
