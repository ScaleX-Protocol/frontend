import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAgentPredictions } from '../hooks/useAgentPredictions';
import { formatTokenAmount, formatTimestamp } from '../utils/formatPolicy';

interface AgentPredictionsTableProps {
  agentTokenId: string;
}

const ITEMS_PER_PAGE = 10;

type ActionFilter = undefined | 'PREDICT' | 'CLAIM';

export default function AgentPredictionsTable({ agentTokenId }: AgentPredictionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [actionFilter, setActionFilter] = useState<ActionFilter>(undefined);
  const { data, isLoading, error } = useAgentPredictions(agentTokenId, { action: actionFilter, limit: 100 });

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 animate-pulse">
        <div className="h-4 w-40 bg-[#1A1A1A] rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`pred-skeleton-${i}`} className="h-10 bg-[#0A0A0A] rounded mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-8 text-center">
        <p className="text-[#606060] text-sm">Failed to load predictions</p>
      </div>
    );
  }

  const allPredictions = data?.data || [];
  const totalPages = Math.max(1, Math.ceil(allPredictions.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentPredictions = allPredictions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleFilterChange = (filter: ActionFilter) => {
    setActionFilter(filter);
    setCurrentPage(1);
  };

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-[#1F1F1F] flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#FFFFFF]">Predictions ({data?.count || 0})</h3>
        <div className="flex gap-1">
          {([undefined, 'PREDICT', 'CLAIM'] as ActionFilter[]).map((filter) => (
            <button
              key={filter ?? 'all'}
              type="button"
              onClick={() => handleFilterChange(filter)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                actionFilter === filter
                  ? 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20'
                  : 'text-[#808080] hover:bg-[#1A1A1A] hover:text-[#E0E0E0]'
              }`}
            >
              {filter ?? 'All'}
            </button>
          ))}
        </div>
      </div>

      {allPredictions.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-[#606060] text-sm">No prediction activity yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#808080] text-xs border-b border-[#1F1F1F] bg-[#161616]">
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Action</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Market</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Direction</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap">Amount</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap">Time</th>
                </tr>
              </thead>
              <tbody>
                {currentPredictions.map((pred) => (
                  <tr key={pred.id} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A] transition-colors whitespace-nowrap">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        pred.action === 'PREDICT'
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-[#2ECC71]/10 text-[#2ECC71]'
                      }`}>
                        {pred.action}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#E0E0E0] whitespace-nowrap">
                      #{pred.marketId}
                      {pred.market?.strikePrice && (
                        <span className="text-[#808080] text-xs ml-1.5">
                          @ {formatTokenAmount(pred.market.strikePrice)}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      {pred.predictUp !== null ? (
                        <span className={pred.predictUp ? 'text-[#2ECC71]' : 'text-[#EF4444]'}>
                          {pred.predictUp ? 'UP' : 'DOWN'}
                        </span>
                      ) : (
                        <span className="text-[#606060]">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right text-[#E0E0E0] whitespace-nowrap">
                      {formatTokenAmount(pred.amount)}
                    </td>
                    <td className="px-5 py-3 text-right text-[#808080] text-xs whitespace-nowrap">
                      {formatTimestamp(pred.timestamp).replace(/, /g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F1F1F] bg-[#0A0A0A]">
              <span className="text-xs text-[#606060]">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, allPredictions.length)} of {allPredictions.length} entries
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1 rounded-md text-[#808080] hover:text-[#E0E0E0] hover:bg-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronLeft size={16} />
                </button>

                <div className="flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    if (
                      page === 1 ||
                      page === totalPages ||
                      Math.abs(page - currentPage) <= 1
                    ) {
                      return (
                        <button
                          key={page}
                          type="button"
                          onClick={() => handlePageChange(page)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium transition-colors ${currentPage === page
                            ? 'bg-[#F06718]/10 text-[#F06718] border border-[#F06718]/20'
                            : 'text-[#808080] hover:bg-[#1A1A1A] hover:text-[#E0E0E0]'
                            }`}
                        >
                          {page}
                        </button>
                      );
                    }
                    if (
                      page === 2 && currentPage > 3 ||
                      page === totalPages - 1 && currentPage < totalPages - 2
                    ) {
                      return <span key={page} className="text-[#606060] self-end px-1">...</span>;
                    }
                    return null;
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1 rounded-md text-[#808080] hover:text-[#E0E0E0] hover:bg-[#1A1A1A] disabled:opacity-30 disabled:hover:bg-transparent"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
