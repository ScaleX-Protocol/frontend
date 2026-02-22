/**
 * @scalex/service-wallet – Mobile barrel (React Native / Expo)
 *
 * This file is resolved instead of index.ts when bundled by Metro (React Native).
 * It re-exports `useWalletStateMobile` as `useWalletState` so existing code
 * that imports `{ useWalletState } from '@scalex/service-wallet'` continues
 * to work without changes — Metro picks up this file automatically via the
 * `"react-native"` export condition.
 *
 * NOTE: `useWalletState` from the web index is intentionally NOT exported here
 * to prevent @privy-io/react-auth from being bundled in the mobile app.
 */

// ─── Config re-exports (platform-agnostic) ────────────────────────────────────
export type { IChainConfig } from './configs/chain';
export { createChainConfig, getBlockExplorerTxUrl } from './configs/chain';

export type { EndpointConfig } from './configs/endpoints';
export { createEndpoints } from './configs/endpoints';

export type { HexAddress, ContractConfig, ChainContractAddresses } from './configs/contracts';
export { createContracts, getContracts } from './configs/contracts';
export {
  BalanceManagerABI,
  PoolManagerABI,
  OrderBookABI,
  ScaleXRouterABI,
} from './configs/contracts';

export * from './configs/tokens';

// ─── Mobile wallet hook (Privy Expo SDK) ─────────────────────────────────────
// Exported as `useWalletState` for drop-in compatibility with web consumers
export { useWalletStateMobile as useWalletState, useWalletStateMobile } from './hooks/useWalletStateMobile';
export type { UseWalletStateMobileReturn } from './hooks/useWalletStateMobile';

// ─── Other hooks (shared / platform-agnostic) ─────────────────────────────────
export * from './hooks/useCurrencies';
export * from './hooks/useCurrency';

// ─── Utils ────────────────────────────────────────────────────────────────────
export * from './utils/wallet.helper';
