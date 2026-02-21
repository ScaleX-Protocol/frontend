/**
 * Mobile-optimized wallet hooks
 *
 * This module provides mobile-compatible implementations of wallet hooks with
 * offline support, caching, and battery optimization.
 * - useWalletState: Stub implementation (TODO: integrate @privy-io/expo)
 * - useCurrencies/useCurrency: Mobile-optimized versions with offline support
 */

export { useWalletState } from './useWalletState';

// Mobile-optimized wallet hooks
export { useCurrencies, type UseCurrenciesParams } from './useCurrencies';
export { useCurrency } from './useCurrency';
