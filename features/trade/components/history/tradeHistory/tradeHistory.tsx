import { useTrades, type UseTradesParams } from '@/features/trade/hooks/history/useTrades';
import { useWalletState } from '@/hooks/useWalletState';

export default function TradeHistory({ symbol }: { symbol: string }) {
  const wallet = useWalletState();

  const params: UseTradesParams = {
    symbol: symbol,
    limit: 10,
    user: wallet.embeddedWallet.address,
    orderBy: 'asc', //'asc' | 'desc';
  };

  const { data, isLoading, error } = useTrades(params);

  if (isLoading || error || !data) {
    console.log('error trades data');
    // Place to handle error trades
  };

  console.log(data);

  return (
    <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border border-[#3A3A3A]">
          <thead className="bg-[#3A3A3A]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Pair
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Fee
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Time
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]"></tbody>
        </table>
      </div>
    </div>
  );
}
