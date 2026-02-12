// Contract addresses and ABIs for mobile app
// Chain: Base Sepolia (84532)

export type HexAddress = `0x${string}`;

export const CHAIN_ID = 84532; // Base Sepolia

export const Contracts = {
  balanceManagerAddress:
    "0xCe3C3b216dC2A3046bE3758Fa42729bca54b2b89" as HexAddress,
  scaleXRouterAddress:
    "0x7D6657eB26636D2007be6a058b1fc4F50919142c" as HexAddress,
  poolManagerAddress:
    "0xE3D7C79608eBd053f082973f4edE2c817bF864D5" as HexAddress,
};

// BalanceManager Contract ABI - Essential functions only
export const BalanceManagerABI = [
  // deposit (for ETH with value)
  {
    inputs: [
      { internalType: "address", name: "currency", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "from_", type: "address" },
      { internalType: "address", name: "to", type: "address" },
    ],
    name: "deposit",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  // depositLocal (for ERC20 tokens)
  {
    inputs: [
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
    ],
    name: "depositLocal",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  // getBalance
  {
    inputs: [
      { internalType: "address", name: "user", type: "address" },
      { internalType: "address", name: "currency", type: "address" },
    ],
    name: "getBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Error definitions
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: [
      { name: "user", type: "address" },
      { name: "id", type: "uint256" },
      { name: "want", type: "uint256" },
      { name: "have", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "ZeroAmount",
    inputs: [],
  },
  {
    type: "error",
    name: "TransferError",
    inputs: [
      { name: "user", type: "address" },
      { name: "currency", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "TokenNotSupportedForLocalDeposits",
    inputs: [{ name: "token", type: "address" }],
  },
  {
    type: "error",
    name: "InvalidRecipientAddress",
    inputs: [],
  },
  {
    type: "error",
    name: "ERC20InsufficientBalance",
    inputs: [
      { name: "sender", type: "address" },
      { name: "balance", type: "uint256" },
      { name: "needed", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "ERC20InsufficientAllowance",
    inputs: [
      { name: "spender", type: "address" },
      { name: "allowance", type: "uint256" },
      { name: "needed", type: "uint256" },
    ],
  },
] as const;
