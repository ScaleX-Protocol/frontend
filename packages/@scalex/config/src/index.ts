/**
 * @scalex/config
 *
 * Single source of truth for all ScaleX configuration.
 * Used by both apps/web and apps/mobile — each app injects its own env values.
 */

export { createChainConfig, getBlockExplorerTxUrl } from './chain';
export type { IChainConfig } from './chain';

export { getEndpoints, createEndpoints, DefaultEndpoints } from './endpoints';
export type { EndpointConfig, EnvLike } from './endpoints';

export { createContracts, getContracts } from './contracts';
export type { ContractConfig, ChainContractAddresses, HexAddress } from './contracts';

export * from './networks/evm';
export * from './networks/svm';
export * from './contracts/evm';
export * from './contracts/svm';

// Registry — global singletons registered by each app at startup
export {
  registerAppConfig,
  getChainConfig,
  getRegisteredContracts,
  getRegisteredEndpoints,
  ChainConfig,
  Contracts,
  Endpoints,
  config,
} from './registry';
export type { AppConfig } from './registry';