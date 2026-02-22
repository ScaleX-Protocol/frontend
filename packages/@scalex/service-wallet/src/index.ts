/**
 * @scalex/service-wallet – Web barrel (React / Vite)
 *
 * This file is resolved by Vite/webpack for the web app.
 * For React Native / Expo (Metro), `index.native.ts` is resolved instead
 * via the `"react-native"` export condition in package.json.
 *
 * NOTE: `useWalletState` here uses @privy-io/react-auth (web-only).
 * Mobile code must NEVER import from this file directly.
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

// ─── Web wallet hooks (Privy React Auth SDK) ──────────────────────────────────
export * from './hooks/useWalletState';
export * from './hooks/useChainValidator';
// Type-only re-export for tsc resolution — Metro resolves index.native.ts at runtime.
// NEVER import the runtime value here; doing so would pull @privy-io/expo (and
// expo-apple-authentication) into the Vite/web bundle and cause build failures.
export type { UseWalletStateMobileReturn, useWalletStateMobile } from './hooks/useWalletStateMobile';


// ─── Other hooks (shared / platform-agnostic) ─────────────────────────────────
export * from './hooks/useCurrencies';
export * from './hooks/useCurrency';

// ─── Utils ────────────────────────────────────────────────────────────────────
export * from './utils/wallet.helper';
