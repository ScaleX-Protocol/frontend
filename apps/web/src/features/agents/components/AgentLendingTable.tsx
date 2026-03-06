import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAgentLending } from '../hooks/useAgentLending';
import { formatTokenAmount, formatTimestamp } from '../utils/formatPolicy';

interface AgentLendingTableProps {
  agentTokenId: string;
}

const ITEMS_PER_PAGE = 10;

export default function AgentLendingTable({ agentTokenId }: AgentLendingTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useAgentLending(agentTokenId);

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 animate-pulse">
        <div className="h-4 w-32 bg-[#1A1A1A] rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`lending-skeleton-${i}`} className="h-10 bg-[#0A0A0A] rounded mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-8 text-center">
        <p className="text-[#606060] text-sm">Failed to load lending activity</p>
      </div>
    );
  }

  const allEvents = data?.data || [];
  const totalPages = Math.max(1, Math.ceil(allEvents.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentEvents = allEvents.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const eventTypeColor = (type: string) => {
    switch (type) {
      case 'BORROW': return 'bg-yellow-500/10 text-yellow-400';
      case 'REPAY': return 'bg-[#2ECC71]/10 text-[#2ECC71]';
      case 'SUPPLY_COLLATERAL': return 'bg-blue-500/10 text-blue-400';
      case 'WITHDRAW_COLLATERAL': return 'bg-red-500/10 text-red-400';
      default: return 'bg-[#333333] text-[#808080]';
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-[#1F1F1F] flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#FFFFFF]">Lending Activity ({data?.count || 0})</h3>
      </div>

      {allEvents.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-[#606060] text-sm">No lending activity yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#808080] text-xs border-b border-[#1F1F1F] bg-[#161616]">
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Event Type</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Token</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap">Amount</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Owner</th>
                  <th className="text-right px-5 py-3 font-medium whitespace-nowrap">Time</th>
                </tr>
              </thead>
              <tbody>
                {currentEvents.map((event) => (
                  <tr key={event.id} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A] transition-colors whitespace-nowrap">
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${eventTypeColor(event.eventType)}`}>
                        {event.eventType.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#E0E0E0] font-mono text-xs whitespace-nowrap">
                      {event.token ? `${event.token.slice(0, 6)}...${event.token.slice(-4)}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-[#E0E0E0] whitespace-nowrap">
                      {formatTokenAmount(event.amount)}
                    </td>
                    <td className="px-5 py-3 text-[#808080] font-mono text-xs whitespace-nowrap">
                      {event.owner ? `${event.owner.slice(0, 6)}...${event.owner.slice(-4)}` : '-'}
                    </td>
                    <td className="px-5 py-3 text-right text-[#808080] text-xs whitespace-nowrap">
                      {formatTimestamp(event.timestamp).replace(/, /g, ' ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F1F1F] bg-[#0A0A0A]">
              <span className="text-xs text-[#606060]">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, allEvents.length)} of {allEvents.length} entries
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
