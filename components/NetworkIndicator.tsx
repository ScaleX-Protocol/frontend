'use client';

import { useChainId } from 'wagmi';
import { AlertCircle } from 'lucide-react';

const SUPPORTED_NETWORKS = {
  31337: { name: 'localhost', status: 'supported' },
  11155931: { name: 'Base Sepolia', status: 'supported' },
  84532: { name: 'Base Mainnet', status: 'coming-soon' }
};

export default function NetworkIndicator() {
  const chainId = useChainId();
  const networkInfo = SUPPORTED_NETWORKS[chainId as keyof typeof SUPPORTED_NETWORKS];

  if (!networkInfo) {
    return (
      <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/20 mb-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            Unsupported network (Chain ID: {chainId}). Please connect to a supported network.
          </span>
        </div>
      </div>
    );
  }

  if (networkInfo.status === 'coming-soon') {
    return (
      <div className="p-3 rounded-lg bg-yellow-900/20 border border-yellow-500/20 mb-4">
        <div className="flex items-center gap-2 text-yellow-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">
            {networkInfo.name} is coming soon! Please switch to localhost or Base Sepolia for testing.
          </span>
        </div>
      </div>
    );
  }

  return null; // No indicator for supported networks
}