/**
 * @scalex/service-wallet – Chain config
 *
 * Re-exports the platform-agnostic factory and type from @scalex/config.
 * Each app creates its own ChainConfig by calling createChainConfig()
 * with the chain ID from its own env vars — no hardcoding here.
 */
export type { IChainConfig } from '@scalex/config';
export { createChainConfig, getBlockExplorerTxUrl } from '@scalex/config';
