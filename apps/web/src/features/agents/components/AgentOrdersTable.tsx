import { useAgentOrders } from '../hooks/useAgentOrders';
import { formatTokenAmount, formatTimestamp } from '../utils/formatPolicy';

interface AgentOrdersTableProps {
  agentTokenId: string;
  limit?: number;
}

export default function AgentOrdersTable({ agentTokenId, limit = 20 }: AgentOrdersTableProps) {
  const { data, isLoading, error } = useAgentOrders(agentTokenId, { limit });

  if (isLoading) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 animate-pulse">
        <div className="h-4 w-32 bg-[#1A1A1A] rounded mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={`order-skeleton-${i}`} className="h-10 bg-[#0A0A0A] rounded mb-2" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 text-center">
        <p className="text-[#606060] text-sm">Failed to load orders</p>
      </div>
    );
  }

  const orders = data?.data || [];

  return (
    <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-[#1F1F1F]">
        <h3 className="text-sm font-semibold text-[#FFFFFF]">Orders ({data?.count || 0})</h3>
      </div>

      {orders.length === 0 ? (
        <div className="p-6 text-center">
          <p className="text-[#606060] text-sm">No orders placed yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[#606060] text-xs border-b border-[#1F1F1F]">
                <th className="text-left px-4 py-2 font-medium">ID</th>
                <th className="text-left px-4 py-2 font-medium">Side</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-right px-4 py-2 font-medium">Price</th>
                <th className="text-right px-4 py-2 font-medium">Quantity</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Time</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-[#0A0A0A] hover:bg-[#161616]">
                  <td className="px-4 py-2.5 text-[#808080] font-mono text-xs">{order.orderId}</td>
                  <td className="px-4 py-2.5">
                    <span className={order.side === 'Buy' ? 'text-green-400' : 'text-red-400'}>
                      {order.side}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-[#E0E0E0]">{order.type}</td>
                  <td className="px-4 py-2.5 text-right text-[#E0E0E0]">{formatTokenAmount(order.price)}</td>
                  <td className="px-4 py-2.5 text-right text-[#E0E0E0]">{formatTokenAmount(order.quantity, 18)}</td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      order.status === 'OPEN' ? 'bg-blue-500/10 text-blue-400' :
                      order.status === 'FILLED' ? 'bg-green-500/10 text-green-400' :
                      order.status === 'CANCELLED' ? 'bg-[#333333] text-[#808080]' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right text-[#808080] text-xs">
                    {formatTimestamp(order.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
