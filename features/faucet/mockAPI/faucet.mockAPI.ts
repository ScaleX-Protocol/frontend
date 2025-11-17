import type {
  BalanceResponse,
  FaucetConfig,
  FaucetCooldownResponse,
  FaucetRequest,
  FaucetRequestsResponse,
  FaucetStats,
  FaucetToken,
  FaucetTokensResponse,
  HexAddress,
  LastRequestTimeResponse,
  UserBalance,
} from '../types/faucet.types';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockFaucetTokens: FaucetToken[] = [
  {
    token: '0x1234567890123456789012345678901234567890' as HexAddress,
    symbol: 'GTX',
    decimals: 18,
    name: 'GTX Token',
    totalSupply: '1000000000000000000000000', // 1M tokens
    isActive: true,
  },
  {
    token: '0x2345678901234567890123456789012345678901' as HexAddress,
    symbol: 'USDT',
    decimals: 6,
    name: 'Tether USD',
    totalSupply: '5000000000000', // 5M USDT
    isActive: true,
  },
  {
    token: '0x3456789012345678901234567890123456789012' as HexAddress,
    symbol: 'WETH',
    decimals: 18,
    name: 'Wrapped Ethereum',
    totalSupply: '500000000000000000000', // 500 WETH
    isActive: true,
  },
  {
    token: '0x4567890123456789012345678901234567890123' as HexAddress,
    symbol: 'DAI',
    decimals: 18,
    name: 'Dai Stablecoin',
    totalSupply: '2000000000000000000000000', // 2M DAI
    isActive: true,
  },
  {
    token: '0x5678901234567890123456789012345678901234' as HexAddress,
    symbol: 'LINK',
    decimals: 18,
    name: 'Chainlink',
    totalSupply: '750000000000000000000000', // 750K LINK
    isActive: false,
  },
];

const mockFaucetRequests: FaucetRequest[] = [
  {
    id: 'req_2',
    user: '0xbcdef12345678901234567890123456789012345' as HexAddress,
    token: '0x2345678901234567890123456789012345678901' as HexAddress,
    tokenSymbol: 'USDT',
    amount: '1000000000', // 1000 USDT
    timestamp: '2025-11-14T09:15:00Z',
    txHash: '0xdef456789012345678901234567890123456789012345678901234567890' as HexAddress,
    status: 'completed',
    blockNumber: 1234560,
  },
  {
    id: 'req_3',
    user: '0xcdef123456789012345678901234567890123456' as HexAddress,
    token: '0x3456789012345678901234567890123456789012' as HexAddress,
    tokenSymbol: 'WETH',
    amount: '5000000000000000000', // 5 WETH
    timestamp: '2025-11-14T08:45:00Z',
    txHash: '0x456789012345678901234567890123456789012345678901234567890123' as HexAddress,
    status: 'completed',
    blockNumber: 1234555,
  },
  {
    id: 'req_4',
    user: '0xdef1234567890123456789012345678901234567' as HexAddress,
    token: '0x4567890123456789012345678901234567890123' as HexAddress,
    tokenSymbol: 'DAI',
    amount: '500000000000000000000', // 500 DAI
    timestamp: '2025-11-14T07:20:00Z',
    txHash: '0x789012345678901234567890123456789012345678901234567890123456' as HexAddress,
    status: 'completed',
    blockNumber: 1234550,
  },
  {
    id: 'req_5',
    user: '0xef12345678901234567890123456789012345678' as HexAddress,
    token: '0x1234567890123456789012345678901234567890' as HexAddress,
    tokenSymbol: 'SCX',
    amount: '100000000000000000000', // 100 tokens
    timestamp: '2025-11-14T06:10:00Z',
    txHash: '0x012345678901234567890123456789012345678901234567890123456789' as HexAddress,
    status: 'pending',
    blockNumber: 1234548,
  },
  {
    id: 'req_6',
    user: '0xf123456789012345678901234567890123456789' as HexAddress,
    token: '0x2345678901234567890123456789012345678901' as HexAddress,
    tokenSymbol: 'USDT',
    amount: '1000000000', // 1000 USDT
    timestamp: '2025-11-13T22:30:00Z',
    txHash: '0x123456789012345678901234567890123456789012345678901234567890' as HexAddress,
    status: 'completed',
    blockNumber: 1234540,
  },
  {
    id: 'req_7',
    user: '0x0123456789012345678901234567890123456789' as HexAddress,
    token: '0x3456789012345678901234567890123456789012' as HexAddress,
    tokenSymbol: 'WETH',
    amount: '5000000000000000000', // 5 WETH
    timestamp: '2025-11-13T20:15:00Z',
    txHash: '0x234567890123456789012345678901234567890123456789012345678901' as HexAddress,
    status: 'failed',
    blockNumber: 1234535,
  },
  {
    id: 'req_8',
    user: '0x1234567890123456789012345678901234567891' as HexAddress,
    token: '0x4567890123456789012345678901234567890123' as HexAddress,
    tokenSymbol: 'DAI',
    amount: '500000000000000000000', // 500 DAI
    timestamp: '2025-11-13T18:45:00Z',
    txHash: '0x345678901234567890123456789012345678901234567890123456789012' as HexAddress,
    status: 'completed',
    blockNumber: 1234530,
  },
];

const mockUserBalances: Record<HexAddress, UserBalance[]> = {
  '0xabcdef1234567890123456789012345678901234': [
    {
      token: '0x1234567890123456789012345678901234567890' as HexAddress,
      balance: '1500000000000000000000', // 1500 GTX
      decimals: 18,
    },
    {
      token: '0x2345678901234567890123456789012345678901' as HexAddress,
      balance: '5000000000', // 5000 USDT
      decimals: 6,
    },
    {
      token: '0x3456789012345678901234567890123456789012' as HexAddress,
      balance: '25000000000000000000', // 25 WETH
      decimals: 18,
    },
  ],
};

const mockFaucetBalances: Record<HexAddress, string> = {
  '0x1234567890123456789012345678901234567890': '500000000000000000000000', // 500K GTX
  '0x2345678901234567890123456789012345678901': '2500000000000', // 2.5M USDT
  '0x3456789012345678901234567890123456789012': '250000000000000000000', // 250 WETH
  '0x4567890123456789012345678901234567890123': '1000000000000000000000000', // 1M DAI
  '0x5678901234567890123456789012345678901234': '375000000000000000000000', // 375K LINK
};

const mockLastRequestTimes: Record<HexAddress, number> = {
  '0xabcdef1234567890123456789012345678901234': Math.floor(Date.now() / 1000) - 3600, // 1 hour ago
  '0xbcdef12345678901234567890123456789012345': Math.floor(Date.now() / 1000) - 7200, // 2 hours ago
  '0xcdef123456789012345678901234567890123456': Math.floor(Date.now() / 1000) - 86400, // 1 day ago
};

const mockFaucetConfig: FaucetConfig = {
  cooldownPeriod: 86400, // 24 hours in seconds
  requestAmount: '100000000000000000000', // 100 tokens
  maxDailyRequests: 10,
  isActive: true,
};

const mockFaucetStats: FaucetStats = {
  totalRequests: 8,
  totalTokensDistributed: '2500000000000000000000', // 2500 tokens total
  uniqueUsers: 6,
  activeTokens: 4,
};

export const mockApi = {
  // Fetch faucet tokens
  getFaucetTokens: async (chainId: number): Promise<FaucetTokensResponse> => {
    await delay(800);
    return {
      faucetTokenss: {
        items: mockFaucetTokens,
        totalCount: mockFaucetTokens.length,
      },
    };
  },

  // Fetch faucet requests
  getFaucetRequests: async (chainId: number, limit: number = 50): Promise<FaucetRequestsResponse> => {
    await delay(1000);
    return {
      faucetRequestss: {
        items: mockFaucetRequests.slice(0, limit),
        totalCount: mockFaucetRequests.length,
      },
    };
  },

  // Get user balance for a specific token
  getUserBalance: async (userAddress: HexAddress, tokenAddress: HexAddress): Promise<BalanceResponse> => {
    await delay(500);
    const userBalances = mockUserBalances[userAddress] || [];
    const balance = userBalances.find((b) => b.token === tokenAddress);
    return {
      balance: balance?.balance || '0',
    };
  },

  // Get faucet balance for a specific token
  getFaucetBalance: async (faucetAddress: HexAddress, tokenAddress: HexAddress): Promise<BalanceResponse> => {
    await delay(500);
    return {
      balance: mockFaucetBalances[tokenAddress] || '0',
    };
  },

  // Get last request time for a user
  getLastRequestTime: async (userAddress: HexAddress, faucetAddress: HexAddress): Promise<LastRequestTimeResponse> => {
    await delay(400);
    return {
      timestamp: mockLastRequestTimes[userAddress] || 0,
    };
  },

  // Get faucet cooldown period
  getFaucetCooldown: async (faucetAddress: HexAddress): Promise<FaucetCooldownResponse> => {
    await delay(300);
    return {
      cooldown: mockFaucetConfig.cooldownPeriod,
    };
  },

  // Request tokens from faucet
  requestTokens: async (
    userAddress: HexAddress,
    tokenAddress: HexAddress,
  ): Promise<{ txHash: HexAddress; success: boolean }> => {
    await delay(2000); // Simulate transaction time

    // Simulate success/failure (90% success rate)
    const success = Math.random() > 0.1;

    if (!success) {
      throw new Error('Transaction failed: Insufficient faucet balance');
    }

    const txHash =
      `0x${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}${Math.random().toString(16).substring(2)}` as HexAddress;

    return {
      txHash,
      success: true,
    };
  },

  // Get faucet stats
  getFaucetStats: async (): Promise<FaucetStats> => {
    await delay(600);
    return mockFaucetStats;
  },
};
