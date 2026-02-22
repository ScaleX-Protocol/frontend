/**
 * apps/mobile – Wallet state hook
 *
 * Thin re-export from @scalex/service-wallet.
 * Metro resolves @scalex/service-wallet to index.native.ts which exports
 * useWalletStateMobile as useWalletState — so this just passes it through.
 */
export { useWalletState } from '@scalex/service-wallet';
export type { UseWalletStateMobileReturn } from '@scalex/service-wallet';
