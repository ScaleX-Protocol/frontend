import { formatUnits } from 'viem';
import { useFaucetRequestData } from '../../hooks/useFaucetRequestData';

export default function History() {
  const chainId = 1;
  const { faucetRequestsData, loading: requestsLoading, refetch: refetchRequests } = useFaucetRequestData(chainId);

  return (
    <div className="w-full bg-[#2C2C2C] rounded-md p-2">
      <div className="mb-4">
        <span className="text-2xl font-bold">Recent Requests</span>
      </div>
      <div className="rounded-xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full border border-[#3A3A3A]">
            <thead className="bg-[#3A3A3A]">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A3A3A]">
              {faucetRequestsData?.faucetRequestss.items.slice(0, 5).map((request) => (
                <tr key={request.id} className="hover:bg-[#3D3D3D] transition-colors">
                  <td className="px-4 py-3 text-[#E0E0E0]">{request.tokenSymbol}</td>
                  <td className="px-4 py-3 text-[#E0E0E0] font-mono">
                    {Number(formatUnits(BigInt(request.amount), 18)).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        request.status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : request.status === 'pending'
                            ? 'bg-yellow-500/20 text-yellow-400'
                            : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[#E0E0E0]/70 text-sm">
                    {new Date(request.timestamp).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
