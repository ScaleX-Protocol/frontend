/**
 * apps/web – Configuration
 *
 * Single config entry for the web app. Reads VITE_* env vars and calls
 * @scalex/config factories. Import from here — never reach into packages directly.
 */
import { createChainConfig, createEndpoints, createContracts } from '@scalex/config';
import type { HexAddress } from '@scalex/config';

export const Endpoints = createEndpoints({
  apiUrl:     import.meta.env.VITE_API_URL     || 'https://base-sepolia-api.scalex.money',
  indexerUrl: import.meta.env.VITE_INDEXER_API_URL || 'https://base-sepolia-indexer.scalex.money',
  wsUrl:      import.meta.env.VITE_WS_API_URL  || 'wss://base-sepolia-websocket.scalex.money',
});

export const ChainConfig = createChainConfig(
  Number(import.meta.env.VITE_CHAIN_ID || 84532),
  import.meta.env.VITE_BLOCK_EXPLORER_URL,
);

export const Contracts = createContracts(ChainConfig.defaultChainId, {
  balanceManagerAddress:  (import.meta.env.VITE_BALANCE_MANAGER_CONTRACT  || '0x0000000000000000000000000000000000000000') as HexAddress,
  scaleXRouterAddress:    (import.meta.env.VITE_SCALEX_ROUTER_CONTRACT    || '0x0000000000000000000000000000000000000000') as HexAddress,
  poolManagerAddress:     (import.meta.env.VITE_POOL_MANAGER_CONTRACT      || '0x0000000000000000000000000000000000000000') as HexAddress,
  lendingManagerAddress:  (import.meta.env.VITE_LENDING_MANAGER_CONTRACT  || undefined) as HexAddress | undefined,
  tokenRegistryAddress:   (import.meta.env.VITE_TOKEN_REGISTRY_CONTRACT   || undefined) as HexAddress | undefined,
  oracleAddress:          (import.meta.env.VITE_ORACLE_CONTRACT            || undefined) as HexAddress | undefined,
});
