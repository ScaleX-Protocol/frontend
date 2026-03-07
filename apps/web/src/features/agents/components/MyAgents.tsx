import { useState, useCallback } from 'react';
import { Link } from '@tanstack/react-router';
import { Bot, Wallet } from 'lucide-react';
import { useWallets } from '@privy-io/react-auth';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { useQueryClient } from '@tanstack/react-query';
import { AgentRouterABI, Contracts } from '@/configs/contracts';
import { useWalletState } from '@/hooks/useWalletState';
import { useMyAgents } from '../hooks/useMyAgents';
import { useMyOrders } from '../hooks/useMyOrders';
import MyAgentCard from './MyAgentCard';
import AgentOrdersTable from './AgentOrdersTable';

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

export default function MyAgents() {
  const { wallets } = useWallets();
  const wallet = useWalletState();
  const walletAddress = wallet.embeddedWallet.address !== 'Not Created' ? wallet.embeddedWallet.address : undefined;
  const queryClient = useQueryClient();
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const { data, isLoading, error } = useMyAgents(walletAddress);
  const agents = data?.data || [];
  const { data: ordersData, isLoading: ordersLoading } = useMyOrders(walletAddress, { limit: 100 });

  const handleRevoke = useCallback(async (agentTokenId: string) => {
    if (!confirm('Revoke this agent? It will no longer trade on your behalf.')) return;
    if (!walletAddress) return;

    setRevokingId(agentTokenId);
    try {
      const wallet = wallets.find(w => w.walletClientType === 'privy' || w.connectorType === 'injected') || wallets[0];
      if (!wallet) throw new Error('No wallet');

      await wallet.switchChain(CHAIN_ID);
      const provider = await wallet.getEthereumProvider();

      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: baseSepolia,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const { request } = await publicClient.simulateContract({
        account: walletAddress as `0x${string}`,
        address: Contracts[CHAIN_ID].agentRouterAddress,
        abi: AgentRouterABI,
        functionName: 'revoke',
        args: [BigInt(agentTokenId)],
      });

      const hash = await walletClient.writeContract(request);
      await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });

      queryClient.invalidateQueries({ queryKey: ['myAgents'] });
      queryClient.invalidateQueries({ queryKey: ['agentPolicy'] });
    } catch (err) {
      console.error('Revoke failed:', err);
    } finally {
      setRevokingId(null);
    }
  }, [wallets, walletAddress, queryClient]);

  // Not connected
  if (!walletAddress) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 p-6">
        <Wallet size={48} className="text-[#333333]" />
        <h2 className="text-[#FFFFFF] font-semibold text-lg">Connect Your Wallet</h2>
        <p className="text-[#606060] text-sm text-center max-w-sm">
          Connect your wallet to view and manage the AI agents you've authorized.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#FFFFFF]">My Agents</h1>
          <p className="text-sm text-[#606060] mt-1">
            Agents you've authorized to trade on your behalf
          </p>
        </div>
        <Link
          to="/agents"
          className="px-4 py-2 btn-primary rounded-lg text-sm text-white font-semibold transition-colors"
        >
          Browse Marketplace
        </Link>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`my-agent-skeleton-${i}`} className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-[#1A1A1A]" />
                <div className="space-y-2">
                  <div className="h-4 w-24 bg-[#1A1A1A] rounded" />
                  <div className="h-3 w-16 bg-[#1A1A1A] rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="h-14 bg-[#0A0A0A] rounded-lg" />
                <div className="h-14 bg-[#0A0A0A] rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="text-center py-12">
          <p className="text-[#808080]">Failed to load your agents.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && agents.length === 0 && (
        <div className="text-center py-16">
          <Bot size={48} className="mx-auto text-[#333333] mb-4" />
          <h3 className="text-[#FFFFFF] font-semibold mb-2">No agents authorized</h3>
          <p className="text-[#606060] text-sm mb-4">
            Browse the marketplace to find and authorize AI trading agents.
          </p>
          <Link
            to="/agents"
            className="inline-flex px-4 py-2 btn-primary rounded-lg text-sm text-white font-semibold transition-colors"
          >
            Browse Marketplace
          </Link>
        </div>
      )}

      {/* Agent Cards */}
      {!isLoading && agents.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent) => (
              <MyAgentCard
                key={agent.id}
                agent={agent}
                ownerAddress={walletAddress!}
                onRevoke={handleRevoke}
                isRevoking={revokingId === agent.agentTokenId}
              />
            ))}
          </div>

          {/* Orders placed across all authorized agents */}
          {walletAddress && (
            <div>
              <h2 className="text-lg font-semibold text-[#FFFFFF] mb-3">My Orders</h2>
              {ordersLoading ? (
                <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 animate-pulse">
                  <div className="h-4 w-32 bg-[#1A1A1A] rounded mb-4" />
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={`order-skeleton-${i}`} className="h-10 bg-[#0A0A0A] rounded mb-2" />
                  ))}
                </div>
              ) : (
                <AgentOrdersTable
                  agentTokenId={agents[0]?.agentTokenId}
                  owner={walletAddress}
                  preloadedData={ordersData}
                />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
