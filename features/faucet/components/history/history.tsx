import { ExternalLink, RefreshCw } from 'lucide-react';
import { useWalletState } from '@/hooks/useWalletState';
import { type UseFaucetHistoryParams, useFaucetHistory } from '../../hooks/useFaucetHistory';

export default function History() {
  const wallet = useWalletState();

  const params: UseFaucetHistoryParams = {
    address: wallet.externalWallet.address,
    chainId: wallet.externalWallet.chainId,
    limit: 20,
  };

  const { data, isLoading, error, refetch, hasData } = useFaucetHistory(params);

  if (!wallet.externalWallet.address) {
    return (
      <div className="w-full bg-[#2C2C2C] rounded-md p-2">
        <div className="flex items-center justify-center p-12">
          <div className="text-[#E0E0E0]/70">User address not configured</div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#2C2C2C] rounded-md p-2">
      <div className="mb-4 flex items-center justify-between">
        <span className="text-2xl font-bold text-[#E0E0E0]">Recent Requests</span>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-[#F06718]/20 text-[#F06718] rounded hover:bg-[#F06718]/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? 'Loading...' : hasData ? 'Refresh' : 'Load History'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">Failed to load history: {error}</p>
        </div>
      )}

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
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Transaction
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-[#E0E0E0] uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#3A3A3A]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="text-[#E0E0E0]/70">Loading...</div>
                  </td>
                </tr>
              ) : !hasData ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center">
                    <div className="text-[#E0E0E0]/70">No faucet requests found</div>
                  </td>
                </tr>
              ) : (
                data.slice(0, 10).map((request) => (
                  <tr key={request.id} className="hover:bg-[#3D3D3D] transition-colors">
                    <td className="px-4 py-3 text-[#E0E0E0]">
                      <div className="flex flex-col">
                        <span className="font-medium">{request.tokenSymbol}</span>
                        <span className="text-xs text-[#E0E0E0]/50 font-mono">
                          {request.tokenAddress.slice(0, 6)}...{request.tokenAddress.slice(-4)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#E0E0E0] font-mono">{request.amountFormatted}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          request.status === 'completed'
                            ? 'bg-green-500/20 text-green-400'
                            : request.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {request.status}
                      </span>
                      {request.status === 'failed' && request.errorMessage && (
                        <div className="text-xs text-red-400 mt-1 max-w-32 truncate">{request.errorMessage}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {request.transactionHash ? (
                        <a
                          href={`https://base-sepolia.blockscout.com/tx/${request.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 justify-center"
                        >
                          {request.transactionHash.slice(0, 6)}...
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-[#E0E0E0]/30 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-[#E0E0E0]/70 text-sm">
                      <div className="flex flex-col items-end">
                        <span>{new Date(request.requestTimestamp).toLocaleDateString()}</span>
                        <span className="text-xs">{new Date(request.requestTimestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
