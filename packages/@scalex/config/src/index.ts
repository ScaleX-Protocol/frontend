/**
 * @scalex/config
 *
 * Single source of truth for all ScaleX configuration factories.
 * Used by both apps/web and apps/mobile — each app injects its own env values.
 */

export { createChainConfig, getBlockExplorerTxUrl } from './chain';
export type { IChainConfig } from './chain';

export { createEndpoints } from './endpoints';
export type { EndpointConfig } from './endpoints';

export { createContracts, getContracts } from './contracts';
export type { ContractConfig, ChainContractAddresses, HexAddress } from './contracts';
