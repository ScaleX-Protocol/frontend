/**
 * @scalex/config – Contract Address Factory
 *
 * Single source of truth for on-chain contract addresses per chain ID.
 * No hardcoding — apps inject addresses from their own env files.
 */

export type HexAddress = `0x${string}`;

export interface ChainContractAddresses {
  balanceManagerAddress: HexAddress;
  scaleXRouterAddress: HexAddress;
  poolManagerAddress: HexAddress;
  lendingManagerAddress?: HexAddress;
  tokenRegistryAddress?: HexAddress;
  oracleAddress?: HexAddress;
}

export type ContractConfig = Record<number, ChainContractAddresses>;

/**
 * Create a contract configuration for a specific chain.
 *
 * @example
 * export const Contracts = createContracts(84532, {
 *   balanceManagerAddress: import.meta.env.VITE_BALANCE_MANAGER_CONTRACT as HexAddress,
 *   scaleXRouterAddress:   import.meta.env.VITE_SCALEX_ROUTER_CONTRACT as HexAddress,
 *   poolManagerAddress:    import.meta.env.VITE_POOL_MANAGER_CONTRACT as HexAddress,
 * });
 */
export const createContracts = (
  chainId: number,
  addresses: ChainContractAddresses,
): ContractConfig => ({
  [chainId]: addresses,
});

/**
 * Retrieve contract addresses for a given chain, with a clear error if misconfigured.
 */
export const getContracts = (
  contracts: ContractConfig,
  chainId: number,
): ChainContractAddresses => {
  const addrs = contracts[chainId];
  if (!addrs) {
    throw new Error(
      `[config] No contract addresses configured for chain ID ${chainId}. Check your env vars.`,
    );
  }
  return addrs;
};
