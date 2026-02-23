import { ExternalLink, RefreshCw, History as HistoryIcon } from 'lucide-react';
import { useWalletState } from '@/hooks/useWalletState';
import { type UseFaucetHistoryParams, useFaucetHistory } from '../../hooks/useFaucetHistory';
import { ChainConfig } from '@/configs/chain';

// Reusable Table Header component
function TableHeader() {
  return (
    <div className="flex flex-row px-6 py-3 bg-[#111111]/50 border-b border-[#1F1F1F]">
      <div className="flex-2 text-[#555555] text-xs leading-[16px] uppercase font-semibold tracking-wide">Token</div>
      <div className="flex-1 text-[#555555] text-xs leading-[16px] uppercase font-semibold tracking-wide text-center">Amount</div>
      <div className="flex-1 text-[#555555] text-xs leading-[16px] uppercase font-semibold tracking-wide text-center">Status</div>
      <div className="flex-[1.5] text-[#555555] text-xs leading-[16px] uppercase font-semibold tracking-wide text-center">Transaction</div>
      <div className="flex-1 text-[#555555] text-xs leading-[16px] uppercase font-semibold tracking-wide text-right">Time</div>
    </div>
  );
}

export default function History() {
  const wallet = useWalletState();

  const userAddress = wallet.externalWallet.address !== 'Not Connected' ? wallet.externalWallet.address : wallet.embeddedWallet.address;

  const params: UseFaucetHistoryParams = {
    address: userAddress,
    // Always use configured chainId from environment, not wallet's chainId
    chainId: ChainConfig.defaultChainId,
    limit: 20,
  };

  const { data, isLoading, error, refetch, hasData } = useFaucetHistory(params);

  if (!wallet.externalWallet.address) {
    return (
      <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">Recent Requests</span>
        </div>
        <div className="flex flex-col">
          <TableHeader />
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-14 h-14 flex items-center justify-center bg-[#111111]/10 rounded-2xl">
              <HistoryIcon className="w-6 h-6 text-[#444444]" />
            </div>
            <span className="text-[#A0A0A0] text-sm">User address not configured</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">Recent Requests</span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#F06718] hover:bg-[#D85A14] text-white rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Retry
          </button>
        </div>
        <div className="flex flex-col">
          <TableHeader />
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-[#E0E0E0] font-medium">Failed to load history</span>
            <span className="text-[#666666] text-sm">{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">Recent Requests</span>
        </div>
        <div className="flex flex-col">
          <TableHeader />
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-8 h-8 border-2 border-[#E0E0E0]/20 border-t-[#E0E0E0] rounded-full animate-spin" />
            <span className="text-[#A0A0A0] text-sm">Loading history...</span>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!hasData) {
    return (
      <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
        <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
          <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">Recent Requests</span>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-[#F06718] hover:bg-[#D85A14] text-white rounded-md transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
            Load History
          </button>
        </div>
        <div className="flex flex-col">
          <TableHeader />
          <div className="flex flex-col items-center justify-center py-6 gap-[14px]">
            <div className="w-14 h-14 flex items-center justify-center bg-[#111111]/10 rounded-2xl">
              <HistoryIcon className="w-6 h-6 text-[#444444]" />
            </div>
            <div className="flex flex-col items-center gap-[6px]">
              <span className="text-[#E0E0E0] font-medium">No Requests Yet</span>
              <span className="text-[#666666] text-sm">Request tokens to see your history here.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Data state
  return (
    <div className="bg-[#161616] rounded-[24px] flex flex-col border border-[#404040]">
      <div className="flex items-center justify-between p-4 border-b border-[#1F1F1F]">
        <span className="text-[#FFFFFF] text-[14px] leading-[20px] font-semibold">Recent Requests</span>
      </div>
      
      <div className="flex flex-col">
        <TableHeader />
        {/* Data rows */}
        <div className="flex flex-col max-h-[320px] overflow-y-auto">
          {data.slice(0, 10).map((request) => (
            <div 
              key={request.id} 
              className="flex flex-row items-center hover:bg-[#1A1A1A] transition-colors border-t border-[#1F1F1F]"
            >
              {/* Token */}
              <div className="flex-2 px-4 py-3">
                <div className="flex flex-col">
                  <span className="text-[#E0E0E0] font-medium">{request.tokenSymbol}</span>
                  <span className="text-xs text-[#666666] font-mono">
                    {request.tokenAddress.slice(0, 6)}...{request.tokenAddress.slice(-4)}
                  </span>
                </div>
              </div>
              
              {/* Amount */}
              <div className="flex-1 px-4 py-3 text-center">
                <span className="text-[#E0E0E0] font-mono">{request.amountFormatted}</span>
              </div>
              
              {/* Status */}
              <div className="flex-1 px-4 py-3 text-center">
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    request.status === 'completed'
                      ? 'bg-green-500/10 text-green-400'
                      : request.status === 'pending'
                        ? 'bg-yellow-500/10 text-yellow-400'
                        : 'bg-red-500/10 text-red-400'
                  }`}
                >
                  {request.status}
                </span>
                {request.status === 'failed' && request.errorMessage && (
                  <div className="text-xs text-red-400 mt-1 max-w-32 truncate">{request.errorMessage}</div>
                )}
              </div>
              
              {/* Transaction */}
              <div className="flex-[1.5] px-4 py-3 text-center">
                {request.transactionHash ? (
                  <a
                    href={`https://base-sepolia.blockscout.com/tx/${request.transactionHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#F06718] hover:text-[#FF8A3D] text-sm flex items-center gap-1 justify-center transition-colors"
                  >
                    {request.transactionHash.slice(0, 6)}...
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-[#666666] text-sm">-</span>
                )}
              </div>
              
              {/* Time */}
              <div className="flex-1 px-4 py-3 text-right">
                <div className="flex flex-col items-end">
                  <span className="text-[#E0E0E0] text-sm">{new Date(request.requestTimestamp).toLocaleDateString()}</span>
                  <span className="text-[#666666] text-xs">{new Date(request.requestTimestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
