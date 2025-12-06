export type HexAddress = `0x${string}`;

export interface ChainContracts {
    [chainId: number] : {
        faucetAddress: HexAddress;
        balanceManagerAddress: HexAddress;
        scaleXRouterAddress: HexAddress;
        poolManagerAddress: HexAddress;
    }
}

export const Contracts: ChainContracts = {
    84532: {
        faucetAddress: '0x1234567890123456789012345678901234567890' as HexAddress,
        balanceManagerAddress: '0x3C693DC86a9ebC01B401E18225b84247A249010d' as HexAddress,
        scaleXRouterAddress: '0x3171e85D77F942deccEfFA76091E660EB78Df1ed' as HexAddress,
        poolManagerAddress: '0x2f2bAd24B62d2F8cFa009066295bB054AbF65bB1' as HexAddress
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
export const ScaleXRouterABI = [
  // Error definitions for proper viem decoding
  {
    "type": "error",
    "name": "OrderHasNoLiquidity",
    "inputs": []
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
    "name": "InsufficientUserBalance",
    "inputs": [
      { "name": "user", "type": "address" },
      { "name": "currency", "type": "address" },
      { "name": "required", "type": "uint256" },
      { "name": "available", "type": "uint256" }
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
    "name": "OrderTooLarge",
    "inputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "maxAmount", "type": "uint256" }
    ]
  },
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
    "name": "PostOnlyWouldTake",
    "inputs": []
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
  }
] as const;