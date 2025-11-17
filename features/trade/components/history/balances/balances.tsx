import { useAccount } from '@/features/trade/hooks/history/useAccount';
import { useWalletState } from '@/hooks/useWalletState';

export default function Balances() {
  const wallet = useWalletState();
  const { data, isLoading, error } = useAccount(wallet.embeddedWallet.address);

  if (isLoading || error || !data) return;

  // base gtx, need to combine with pools, maybe like checking amount in every currency

  console.log(data);

  return (
    <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
      <div className="overflow-x-auto">
        <table className="w-full border border-[#3A3A3A]">
          <thead className="bg-[#3A3A3A]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Asset
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Available
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Locked
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                USD Value
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                % of Portfolio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#3A3A3A]"></tbody>
        </table>
      </div>
    </div>
  );
}
