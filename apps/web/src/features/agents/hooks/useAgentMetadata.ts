import { useQuery } from '@tanstack/react-query';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { IdentityRegistryABI, Contracts } from '@/configs/contracts';

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(),
});

export interface AgentMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export function useAgentMetadata(agentTokenId: string | undefined) {
  return useQuery({
    queryKey: ['agentMetadata', agentTokenId],
    queryFn: async (): Promise<AgentMetadata | null> => {
      const uri = await publicClient.readContract({
        address: Contracts[CHAIN_ID].identityRegistryAddress,
        abi: IdentityRegistryABI,
        functionName: 'tokenURI',
        args: [BigInt(agentTokenId!)],
      });

      if (!uri) return null;

      const res = await fetch(uri);
      if (!res.ok) return null;

      const data = await res.json();
      if (!data.name && !data.description && !data.image) return null;

      return data as AgentMetadata;
    },
    enabled: !!agentTokenId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}
