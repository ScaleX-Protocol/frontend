import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useAgentUsers } from '../hooks/useAgentUsers';
import { formatTimestamp } from '../utils/formatPolicy';

interface AgentUsersTableProps {
  agentTokenId: string;
}

const ITEMS_PER_PAGE = 10;

export default function AgentUsersTable({ agentTokenId }: AgentUsersTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, isLoading, error } = useAgentUsers(agentTokenId);

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 animate-pulse">
        <div className="h-4 w-32 bg-[#1A1A1A] rounded mb-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={`user-skeleton-${i}`} className="h-10 bg-[#0A0A0A] rounded mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-8 text-center">
        <p className="text-[#606060] text-sm">Failed to load users</p>
      </div>
    );
  }

  const allUsers = data?.data || [];
  const totalPages = Math.max(1, Math.ceil(allUsers.length / ITEMS_PER_PAGE));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentUsers = allUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden flex flex-col">
      <div className="px-5 py-4 border-b border-[#1F1F1F] flex items-center justify-between">
        <h3 className="text-base font-semibold text-[#FFFFFF]">Users ({data?.count || 0})</h3>
      </div>

      {allUsers.length === 0 ? (
        <div className="p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
          <p className="text-[#606060] text-sm">No users yet</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[#808080] text-xs border-b border-[#1F1F1F] bg-[#161616]">
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Owner</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Status</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Installed At</th>
                  <th className="text-left px-5 py-3 font-medium whitespace-nowrap">Template</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={user.owner} className="border-b border-[#1F1F1F] hover:bg-[#1A1A1A] transition-colors whitespace-nowrap">
                    <td className="px-5 py-3 text-[#E0E0E0] font-mono text-xs whitespace-nowrap">
                      {user.owner ? `${user.owner.slice(0, 6)}...${user.owner.slice(-4)}` : '-'}
                    </td>
                    <td className="px-5 py-3 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        user.enabled
                          ? 'bg-[#2ECC71]/10 text-[#2ECC71]'
                          : 'bg-[#333333] text-[#808080]'
                      }`}>
                        {user.enabled ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#808080] text-xs whitespace-nowrap">
                      {formatTimestamp(user.installedAt).replace(/, /g, ' ')}
                    </td>
                    <td className="px-5 py-3 text-[#808080] font-mono text-xs whitespace-nowrap">
                      {user.templateUsed ? `${user.templateUsed.slice(0, 6)}...${user.templateUsed.slice(-4)}` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-[#1F1F1F] bg-[#0A0A0A]">
              <span className="text-xs text-[#606060]">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, allUsers.length)} of {allUsers.length} entries
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
