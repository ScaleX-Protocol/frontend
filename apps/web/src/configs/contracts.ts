export type HexAddress = `0x${string}`;

export interface ChainContracts {
    [chainId: number] : {
        faucetAddress: HexAddress;
        balanceManagerAddress: HexAddress;
        scaleXRouterAddress: HexAddress;
        poolManagerAddress: HexAddress;
        agentRouterAddress: HexAddress;
        identityRegistryAddress: HexAddress;
    }
}

// Get chain ID from environment variable
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '84532');

export const Contracts: ChainContracts = {
    [CHAIN_ID]: {
        faucetAddress: '0x0000000000000000000000000000000000000000' as HexAddress,
        balanceManagerAddress: '0x466C3fbb7e87A22393508bd436fb7253965D493A' as HexAddress,
        scaleXRouterAddress: '0x686F847C23a8cda17d4eaa2DEd396e718f8883BF' as HexAddress,
        poolManagerAddress: '0x43B630cD33f80060de49d7C140B2C23b89F191f9' as HexAddress,
        agentRouterAddress: '0xE9c1a6665364294194aa3B1CE89654926b338493' as HexAddress,
        identityRegistryAddress: '0xC2A65565d9E4D901B80a38872688B23B2F8d0975' as HexAddress,
    }
}

// BalanceManager Contract ABI
export const BalanceManagerABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "initialOwner",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "currency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "from_",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "to",
        "type": "address"
      }
    ],
    "name": "deposit",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "token",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "recipient",
        "type": "address"
      }
    ],
    "name": "depositLocal",
    "outputs": [],
    "stateMutability": "nonReentrant",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "currency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      }
    ],
    "name": "withdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "currency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "amount",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "withdraw",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonReentrant",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "currency",
        "type": "address"
      }
    ],
    "name": "getBalance",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  // ========== BalanceManager Errors ==========
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "id", "type": "uint256" },
      { "name": "want", "type": "uint256" },
      { "name": "have", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "TransferError",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "currency", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedOperator",
    "inputs": [
      { "name": "operator", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "UnauthorizedCaller",
    "inputs": [
      { "name": "caller", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidTokenAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRecipientAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenRegistryNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenNotSupportedForLocalDeposits",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidTokenRegistry",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyInitialized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyMailbox",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnknownOriginChain",
    "inputs": [
      { "name": "chainId", "type": "uint32" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidSender",
    "inputs": [
      { "name": "expected", "type": "bytes32" },
      { "name": "actual", "type": "bytes32" }
    ]
  },
  {
    "type": "error",
    "name": "MessageAlreadyProcessed",
    "inputs": [
      { "name": "messageId", "type": "bytes32" }
    ]
  },
  {
    "type": "error",
    "name": "TargetChainNotSupported",
    "inputs": [
      { "name": "chainId", "type": "uint32" }
    ]
  },
  // ========== BalanceManager-specific Errors ==========
  {
    "type": "error",
    "name": "IncorrectEthAmount",
    "inputs": [
      { "name": "expected", "type": "uint256" },
      { "name": "actual", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "EthSentForErc20Deposit",
    "inputs": []
  },
  {
    "type": "error",
    "name": "FeeExceedsTransferAmount",
    "inputs": [
      { "name": "fee", "type": "uint256" },
      { "name": "amount", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "YieldClaimFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "YieldAccrualFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnknownMessageType",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SyntheticTokenNotFound",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "LendingManagerNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BorrowFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RepayFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LendingManagerSupplyFailed",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ]
  },
  // ========== LendingManager Errors (called during withdraw) ==========
  {
    "type": "error",
    "name": "InsufficientLiquidity",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientCollateral",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnsupportedAsset",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LiquidationFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyBalanceManager",
    "inputs": []
  },
  // ========== Oracle Errors (called during withdraw via LendingManager) ==========
  {
    "type": "error",
    "name": "TokenNotSupported",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientPriceHistory",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "window", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientTradeVolume",
    "inputs": [
      { "name": "volume", "type": "uint256" },
      { "name": "minVolume", "type": "uint256" }
    ]
  },
  // ========== Health Factor Errors ==========
  {
    "type": "error",
    "name": "InsufficientHealthFactorForBorrow",
    "inputs": [
      { "name": "projected", "type": "uint256" },
      { "name": "minimum", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientHealthFactorForWithdraw",
    "inputs": [
      { "name": "projected", "type": "uint256" },
      { "name": "minimum", "type": "uint256" }
    ]
  },
  // ========== Common Reentrancy Errors ==========
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },
  {
    "type": "error",
    "name": "ReentrancyReentrancyCall",
    "inputs": []
  },
  // ========== ERC20 & SafeERC20 Errors ==========
  {
    "type": "error",
    "name": "ERC20InsufficientBalance",
    "inputs": [
      { "name": "sender", "type": "address" },
      { "name": "balance", "type": "uint256" },
      { "name": "needed", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InsufficientAllowance",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "allowance", "type": "uint256" },
      { "name": "needed", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "AddressInsufficientBalance",
    "inputs": [
      { "name": "account", "type": "address" }
    ]
  }
] as const;

// PoolManager Contract ABI (minimal for getting pool)
export const PoolManagerABI = [
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "currency0",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "currency1",
            "type": "address"
          }
        ],
        "internalType": "struct PoolKey",
        "name": "key",
        "type": "tuple"
      }
    ],
    "name": "getPool",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "baseCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quoteCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "orderBook",
            "type": "address"
          }
        ],
        "internalType": "struct IPoolManager.Pool",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "currency1",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "currency2",
        "type": "address"
      }
    ],
    "name": "createPoolKey",
    "outputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "currency0",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "currency1",
            "type": "address"
          }
        ],
        "internalType": "struct PoolKey",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "pure",
    "type": "function"
  }
] as const;

// OrderBook Contract ABI (minimal for trading rules)
export const OrderBookABI = [
  {
    "inputs": [],
    "name": "getTradingRules",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "minTradeAmount",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "minAmountMovement",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "minPriceMovement",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "minOrderSize",
            "type": "uint128"
          }
        ],
        "internalType": "struct IOrderBook.TradingRules",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

// ScaleXRouter Contract ABI (includes error definitions for proper decoding)
// Includes all errors from IScaleXRouterErrors, IBalanceManagerErrors, IOrderBookErrors, and IPoolManagerErrors
export const ScaleXRouterABI = [
  // ========== IBalanceManagerErrors ==========
  {
    "type": "error",
    "name": "InsufficientBalance",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "id", "type": "uint256" },
      { "name": "want", "type": "uint256" },
      { "name": "have", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "TransferError",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "currency", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "ZeroAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedOperator",
    "inputs": [
      { "name": "operator", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "UnauthorizedCaller",
    "inputs": [
      { "name": "caller", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidTokenAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidRecipientAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenRegistryNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "TokenNotSupportedForLocalDeposits",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidTokenRegistry",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AlreadyInitialized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyMailbox",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnknownOriginChain",
    "inputs": [
      { "name": "chainId", "type": "uint32" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidSender",
    "inputs": [
      { "name": "expected", "type": "bytes32" },
      { "name": "actual", "type": "bytes32" }
    ]
  },
  {
    "type": "error",
    "name": "MessageAlreadyProcessed",
    "inputs": [
      { "name": "messageId", "type": "bytes32" }
    ]
  },
  {
    "type": "error",
    "name": "TargetChainNotSupported",
    "inputs": [
      { "name": "chainId", "type": "uint32" }
    ]
  },

  // ========== IOrderBookErrors ==========
  {
    "type": "error",
    "name": "SlippageTooHigh",
    "inputs": [
      { "name": "received", "type": "uint256" },
      { "name": "minReceived", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidSlippageTolerance",
    "inputs": [
      { "name": "slippageBps", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "FillOrKillNotFulfilled",
    "inputs": [
      { "name": "filledAmount", "type": "uint128" },
      { "name": "requestedAmount", "type": "uint128" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidOrderType",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidPrice",
    "inputs": [
      { "name": "price", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidPriceIncrement",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidQuantity",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidQuantityIncrement",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OrderHasNoLiquidity",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OrderTooLarge",
    "inputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "maxAmount", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "OrderTooSmall",
    "inputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "minAmount", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "PostOnlyWouldTake",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SlippageExceeded",
    "inputs": [
      { "name": "requestedPrice", "type": "uint256" },
      { "name": "limitPrice", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "TradingPaused",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedCancellation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnauthorizedRouter",
    "inputs": [
      { "name": "router", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientBalanceRequired",
    "inputs": [
      { "name": "requiredDeposit", "type": "uint256" },
      { "name": "userBalance", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "OrderNotFound",
    "inputs": []
  },
  {
    "type": "error",
    "name": "QueueEmpty",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OrderIsNotOpenOrder",
    "inputs": [
      { "name": "status", "type": "uint8" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidSideForQuoteAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "SwapHopFailed",
    "inputs": [
      { "name": "hopIndex", "type": "uint256" },
      { "name": "receivedAmount", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "NoValidSwapPath",
    "inputs": [
      { "name": "srcCurrency", "type": "address" },
      { "name": "dstCurrency", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "IdenticalCurrencies",
    "inputs": [
      { "name": "currency", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "TooManyHops",
    "inputs": [
      { "name": "maxHops", "type": "uint8" },
      { "name": "limit", "type": "uint8" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientSwapBalance",
    "inputs": [
      { "name": "available", "type": "uint256" },
      { "name": "required", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "AutoRepayOnlyForBuyOrders",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoDebtToRepay",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NoCollateralToBorrow",
    "inputs": []
  },
  {
    "type": "error",
    "name": "AutoBorrowOnlyForSellOrders",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NotAuthorized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "NegativeSpreadCreated",
    "inputs": [
      { "name": "bestBid", "type": "uint128" },
      { "name": "bestAsk", "type": "uint128" }
    ]
  },
  {
    "type": "error",
    "name": "UnauthorizedRouter",
    "inputs": [
      { "name": "router", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "UnauthorizedCancellation",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientOrderBalance",
    "inputs": [
      { "name": "available", "type": "uint256" },
      { "name": "required", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientHealthFactorForBorrow",
    "inputs": [
      { "name": "projected", "type": "uint256" },
      { "name": "minimum", "type": "uint256" }
    ]
  },

  // ========== Oracle Errors ==========
  {
    "type": "error",
    "name": "TokenNotSupported",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "UnauthorizedOracleUpdate",
    "inputs": [
      { "name": "caller", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientTradeVolume",
    "inputs": [
      { "name": "volume", "type": "uint256" },
      { "name": "minVolume", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "InsufficientPriceHistory",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "window", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "StalePrice",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "lastUpdate", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "NoTradingLiquidity",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "ZeroPrice",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PriceAlreadyInitialized",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidConfiguration",
    "inputs": []
  },

  // ========== IPoolManagerErrors ==========
  {
    "type": "error",
    "name": "InvalidRouter",
    "inputs": []
  },
  {
    "type": "error",
    "name": "PoolAlreadyExists",
    "inputs": [
      { "name": "id", "type": "bytes32" }
    ]
  },
  {
    "type": "error",
    "name": "InvalidTradingRule",
    "inputs": [
      { "name": "reason", "type": "string" }
    ]
  },

  // ========== IScaleXRouterErrors (specific to router) ==========
  {
    "type": "error",
    "name": "LendingManagerNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BalanceManagerNotSet",
    "inputs": []
  },
  {
    "type": "error",
    "name": "BorrowFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "RepayFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "DepositFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LiquidationFailed",
    "inputs": []
  },

  // ========== LendingManager Errors ==========
  {
    "type": "error",
    "name": "InsufficientLiquidity",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientCollateral",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnsupportedAsset",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyBalanceManager",
    "inputs": []
  },
  // ========== ERC20 & SafeERC20 Errors ==========
  {
    "type": "error",
    "name": "ERC20InsufficientBalance",
    "inputs": [
      { "name": "sender", "type": "address" },
      { "name": "balance", "type": "uint256" },
      { "name": "needed", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "ERC20InsufficientAllowance",
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "allowance", "type": "uint256" },
      { "name": "needed", "type": "uint256" }
    ]
  },
  {
    "type": "error",
    "name": "SafeERC20FailedOperation",
    "inputs": [
      { "name": "token", "type": "address" }
    ]
  },
  {
    "type": "error",
    "name": "AddressInsufficientBalance",
    "inputs": [
      { "name": "account", "type": "address" }
    ]
  },
  // ========== Reentrancy Errors ==========
  {
    "type": "error",
    "name": "ReentrancyGuardReentrantCall",
    "inputs": []
  },

  // ========== Lending Functions ==========
  {
    "type": "function",
    "name": "borrow",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "repay",
    "stateMutability": "nonpayable",
    "inputs": [
      { "name": "token", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_poolManager",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_balanceManager",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "baseCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quoteCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "orderBook",
            "type": "address"
          }
        ],
        "internalType": "struct IPoolManager.Pool",
        "name": "pool",
        "type": "tuple"
      },
      {
        "internalType": "uint128",
        "name": "_quantity",
        "type": "uint128"
      },
      {
        "internalType": "enum IOrderBook.Side",
        "name": "_side",
        "type": "uint8"
      },
      {
        "internalType": "uint128",
        "name": "depositAmount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "minOutAmount",
        "type": "uint128"
      }
    ],
    "name": "placeMarketOrder",
    "outputs": [
      {
        "internalType": "uint48",
        "name": "orderId",
        "type": "uint48"
      },
      {
        "internalType": "uint128",
        "name": "filled",
        "type": "uint128"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "baseCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quoteCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "orderBook",
            "type": "address"
          }
        ],
        "internalType": "struct IPoolManager.Pool",
        "name": "pool",
        "type": "tuple"
      },
      {
        "internalType": "uint128",
        "name": "_quantity",
        "type": "uint128"
      },
      {
        "internalType": "enum IOrderBook.Side",
        "name": "_side",
        "type": "uint8"
      },
      {
        "internalType": "uint128",
        "name": "depositAmount",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "minOutAmount",
        "type": "uint128"
      },
      {
        "internalType": "bool",
        "name": "autoRepay",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "autoBorrow",
        "type": "bool"
      }
    ],
    "name": "placeMarketOrder",
    "outputs": [
      {
        "internalType": "uint48",
        "name": "orderId",
        "type": "uint48"
      },
      {
        "internalType": "uint128",
        "name": "filled",
        "type": "uint128"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "baseCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quoteCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "orderBook",
            "type": "address"
          }
        ],
        "internalType": "struct IPoolManager.Pool",
        "name": "pool",
        "type": "tuple"
      },
      {
        "internalType": "uint128",
        "name": "_price",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "_quantity",
        "type": "uint128"
      },
      {
        "internalType": "enum IOrderBook.Side",
        "name": "_side",
        "type": "uint8"
      },
      {
        "internalType": "enum IOrderBook.TimeInForce",
        "name": "_timeInForce",
        "type": "uint8"
      },
      {
        "internalType": "uint128",
        "name": "depositAmount",
        "type": "uint128"
      }
    ],
    "name": "placeLimitOrder",
    "outputs": [
      {
        "internalType": "uint48",
        "name": "orderId",
        "type": "uint48"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "baseCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quoteCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "orderBook",
            "type": "address"
          }
        ],
        "internalType": "struct IPoolManager.Pool",
        "name": "pool",
        "type": "tuple"
      },
      {
        "internalType": "uint128",
        "name": "_price",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "_quantity",
        "type": "uint128"
      },
      {
        "internalType": "enum IOrderBook.Side",
        "name": "_side",
        "type": "uint8"
      },
      {
        "internalType": "enum IOrderBook.TimeInForce",
        "name": "_timeInForce",
        "type": "uint8"
      },
      {
        "internalType": "uint128",
        "name": "depositAmount",
        "type": "uint128"
      },
      {
        "internalType": "bool",
        "name": "autoRepay",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "autoBorrow",
        "type": "bool"
      }
    ],
    "name": "placeLimitOrder",
    "outputs": [
      {
        "internalType": "uint48",
        "name": "orderId",
        "type": "uint48"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "components": [
          {
            "internalType": "address",
            "name": "baseCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quoteCurrency",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "orderBook",
            "type": "address"
          }
        ],
        "internalType": "struct IPoolManager.Pool",
        "name": "pool",
        "type": "tuple"
      },
      {
        "internalType": "uint128",
        "name": "_price",
        "type": "uint128"
      },
      {
        "internalType": "uint128",
        "name": "_quantity",
        "type": "uint128"
      },
      {
        "internalType": "enum IOrderBook.Side",
        "name": "_side",
        "type": "uint8"
      },
      {
        "internalType": "enum IOrderBook.TimeInForce",
        "name": "_timeInForce",
        "type": "uint8"
      },
      {
        "internalType": "uint128",
        "name": "depositAmount",
        "type": "uint128"
      },
      {
        "internalType": "bool",
        "name": "autoRepay",
        "type": "bool"
      },
      {
        "internalType": "bool",
        "name": "autoBorrow",
        "type": "bool"
      }
    ],
    "name": "placeLimitOrderWithFlags",
    "outputs": [
      {
        "internalType": "uint48",
        "name": "orderId",
        "type": "uint48"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "baseCurrency",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "quoteCurrency",
        "type": "address"
      },
      {
        "internalType": "uint8",
        "name": "side",
        "type": "uint8"
      }
    ],
    "name": "getBestPrice",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint128",
            "name": "price",
            "type": "uint128"
          },
          {
            "internalType": "uint128",
            "name": "volume",
            "type": "uint128"
          }
        ],
        "internalType": "struct IOrderBook.PriceVolume",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "srcCurrency",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "dstCurrency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "inputAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "slippageToleranceBps",
        "type": "uint256"
      }
    ],
    "name": "calculateMinOutForSwap",
    "outputs": [
      {
        "internalType": "uint128",
        "name": "minOutputAmount",
        "type": "uint128"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "srcCurrency",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "dstCurrency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "srcAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minDstAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "maxHops",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "swap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "receivedAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "srcCurrency",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "dstCurrency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "srcAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "minDstAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint8",
        "name": "maxHops",
        "type": "uint8"
      },
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "depositAmount",
        "type": "uint256"
      },
      {
        "internalType": "bool",
        "name": "keepInBalance",
        "type": "bool"
      }
    ],
    "name": "swap",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "receivedAmount",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // ========== Lending View Functions ==========
  {
    "type": "function",
    "name": "lendingManager",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      { "name": "", "type": "address" }
    ]
  },
  {
    "type": "function",
    "name": "getHealthFactor",
    "stateMutability": "view",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "getUserDebt",
    "stateMutability": "view",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "getUserSupply",
    "stateMutability": "view",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "getAvailableLiquidity",
    "stateMutability": "view",
    "inputs": [
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "calculateMinOutAmountForMarket",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "pool",
        "type": "tuple",
        "components": [
          { "name": "base", "type": "address" },
          { "name": "quote", "type": "address" },
          { "name": "spacing", "type": "uint8" },
          { "name": "fee", "type": "uint24" }
        ]
      },
      { "name": "inputAmount", "type": "uint256" },
      { "name": "side", "type": "uint8" },
      { "name": "slippageToleranceBps", "type": "uint256" }
    ],
    "outputs": [
      { "name": "minOutputAmount", "type": "uint128" }
    ]
  }
] as const;

// LendingManager Contract ABI (for direct calls to lending manager)
export const LendingManagerABI = [
  {
    "type": "function",
    "name": "getProjectedHealthFactor",
    "stateMutability": "view",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "token", "type": "address" },
      { "name": "additionalBorrowAmount", "type": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "getHealthFactor",
    "stateMutability": "view",
    "inputs": [
      { "name": "user", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  {
    "type": "function",
    "name": "getAvailableLiquidity",
    "stateMutability": "view",
    "inputs": [
      { "name": "token", "type": "address" }
    ],
    "outputs": [
      { "name": "", "type": "uint256" }
    ]
  },
  // ========== LendingManager Errors ==========
  {
    "type": "error",
    "name": "InsufficientLiquidity",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InsufficientCollateral",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAmount",
    "inputs": []
  },
  {
    "type": "error",
    "name": "UnsupportedAsset",
    "inputs": []
  },
  {
    "type": "error",
    "name": "LiquidationFailed",
    "inputs": []
  },
  {
    "type": "error",
    "name": "InvalidAddress",
    "inputs": []
  },
  {
    "type": "error",
    "name": "OnlyBalanceManager",
    "inputs": []
  }
] as const;

// IdentityRegistry Contract ABI (ERC-8004 agent identity - tokenURI only)
export const IdentityRegistryABI = [
  {
    "type": "function",
    "name": "tokenURI",
    "stateMutability": "view",
    "inputs": [
      { "name": "tokenId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "string", "internalType": "string" }
    ]
  }
] as const;

// AgentRouter Contract ABI (ERC-8004 agent authorization)
export const AgentRouterABI = [
  {
    "type": "function",
    "name": "authorize",
    "inputs": [
      { "name": "strategyAgentId", "type": "uint256", "internalType": "uint256" },
      {
        "name": "policy",
        "type": "tuple",
        "internalType": "struct PolicyFactoryStorage.Policy",
        "components": [
          { "name": "enabled", "type": "bool" },
          { "name": "installedAt", "type": "uint256" },
          { "name": "expiryTimestamp", "type": "uint256" },
          { "name": "maxOrderSize", "type": "uint256" },
          { "name": "minOrderSize", "type": "uint256" },
          { "name": "whitelistedTokens", "type": "address[]" },
          { "name": "blacklistedTokens", "type": "address[]" },
          { "name": "allowMarketOrders", "type": "bool" },
          { "name": "allowLimitOrders", "type": "bool" },
          { "name": "allowSwap", "type": "bool" },
          { "name": "allowBorrow", "type": "bool" },
          { "name": "allowRepay", "type": "bool" },
          { "name": "allowSupplyCollateral", "type": "bool" },
          { "name": "allowWithdrawCollateral", "type": "bool" },
          { "name": "allowPlaceLimitOrder", "type": "bool" },
          { "name": "allowCancelOrder", "type": "bool" },
          { "name": "allowBuy", "type": "bool" },
          { "name": "allowSell", "type": "bool" },
          { "name": "allowAutoBorrow", "type": "bool" },
          { "name": "maxAutoBorrowAmount", "type": "uint256" },
          { "name": "allowAutoRepay", "type": "bool" },
          { "name": "minDebtToRepay", "type": "uint256" },
          { "name": "minHealthFactor", "type": "uint256" },
          { "name": "maxSlippageBps", "type": "uint256" },
          { "name": "minTimeBetweenTrades", "type": "uint256" },
          { "name": "emergencyRecipient", "type": "address" },
          { "name": "dailyVolumeLimit", "type": "uint256" },
          { "name": "weeklyVolumeLimit", "type": "uint256" },
          { "name": "maxDailyDrawdown", "type": "uint256" },
          { "name": "maxWeeklyDrawdown", "type": "uint256" },
          { "name": "maxTradeVsTVLBps", "type": "uint256" },
          { "name": "minWinRateBps", "type": "uint256" },
          { "name": "minSharpeRatio", "type": "int256" },
          { "name": "maxPositionConcentrationBps", "type": "uint256" },
          { "name": "maxCorrelationBps", "type": "uint256" },
          { "name": "maxTradesPerDay", "type": "uint256" },
          { "name": "maxTradesPerHour", "type": "uint256" },
          { "name": "tradingStartHour", "type": "uint256" },
          { "name": "tradingEndHour", "type": "uint256" },
          { "name": "minReputationScore", "type": "uint256" },
          { "name": "useReputationMultiplier", "type": "bool" },
          { "name": "requiresChainlinkFunctions", "type": "bool" }
        ]
      }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "revoke",
    "inputs": [
      { "name": "strategyAgentId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "isAuthorized",
    "inputs": [
      { "name": "user", "type": "address", "internalType": "address" },
      { "name": "strategyAgentId", "type": "uint256", "internalType": "uint256" }
    ],
    "outputs": [
      { "name": "", "type": "bool", "internalType": "bool" }
    ],
    "stateMutability": "view"
  }
] as const;