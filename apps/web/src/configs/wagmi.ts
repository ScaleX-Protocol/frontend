import { createConfig, http } from 'wagmi';
import { baseSepolia, mantleSepolia, liskSepolia } from './chain';

// Get chain configuration from environment
const getChainFromEnv = () => {
  const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

  switch (chainId) {
    case 5001:
      return mantleSepolia;
    case 4202:
      return liskSepolia;
    case 84532:
    default:
      return baseSepolia;
  }
};

const currentChain = getChainFromEnv();

// Create config with only the current chain from environment
export const wagmiConfig = createConfig({
  chains: [currentChain],
  transports: {
    [currentChain.id]: http(),
  },
} as any);

// Export the current chain for use in other components
export { currentChain };

