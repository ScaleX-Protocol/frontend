export type HexAddress = `0x${string}`;

export interface ChainContracts {
    [chainId: number] : {
        faucetAddress: HexAddress;
        balanceManagerAddress: HexAddress;
        scaleXRouterAddress: HexAddress;
    }
}

export const Contracts: ChainContracts = {
    84532: {
        faucetAddress: '0x1234567890123456789012345678901234567890' as HexAddress,
        balanceManagerAddress: '0xD89114DB8df4d1F30A59CBA14Ca5f9269d7D6075' as HexAddress,
        scaleXRouterAddress: '0xd81F05627eC398719B58F034a0E806D2971958f1' as HexAddress
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

// ScaleXRouter Contract ABI
export const ScaleXRouterABI = [
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
            "name": "base",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quote",
            "type": "address"
          },
          {
            "internalType": "uint16",
            "name": "spacing",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
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
            "name": "base",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quote",
            "type": "address"
          },
          {
            "internalType": "uint16",
            "name": "spacing",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
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
            "name": "base",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quote",
            "type": "address"
          },
          {
            "internalType": "uint16",
            "name": "spacing",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
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
            "name": "base",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "quote",
            "type": "address"
          },
          {
            "internalType": "uint16",
            "name": "spacing",
            "type": "uint16"
          },
          {
            "internalType": "uint256",
            "name": "fee",
            "type": "uint256"
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
  }
] as const;