import { createConfig, http } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';

// Define Mantle Sepolia testnet configuration
const mantleSepolia = {
  id: 5001,
  name: 'Mantle Sepolia Testnet',
  nativeCurrency: { name: 'MANTLE', symbol: 'MANTLE', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_RPC_URL || 'https://testnet.mantle.pub'] },
    public: { http: ['https://testnet.mantle.pub'] },
  },
  blockExplorers: {
    default: { name: 'Mantle Explorer', url: import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://sepolia.mantlescan.xyz' },
  },
  testnet: true,
} as const;

// Get chain configuration from environment
const getChainFromEnv = () => {
  const chainId = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

  switch (chainId) {
    case 5001:
      return mantleSepolia;
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
});

// Export the current chain for use in other components
export { currentChain };
