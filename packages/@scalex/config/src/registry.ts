/**
 * @scalex/config – Singleton App Config Registry
 *
 * Provides a global registry for app-level config instances (ChainConfig,
 * Contracts, Endpoints). Each app registers its singletons at startup via
 * `registerAppConfig()`, and any @scalex package can read them via the
 * typed getters below.
 *
 * IMPORTANT: `registerAppConfig()` must be called before any hook that
 * reads these values (i.e., in providers.tsx / root layout, before children render).
 */

import type { IChainConfig } from './chain';
import type { ContractConfig } from './contracts';
import type { EndpointConfig } from './endpoints';

export interface AppConfig {
  chainConfig: IChainConfig;
  contracts: ContractConfig;
  endpoints: EndpointConfig;
}

let _registry: AppConfig | null = null;

/**
 * Register the app-level config singletons.
 * Call this once at app startup (before any hooks that consume config).
 */
export function registerAppConfig(config: AppConfig): void {
  _registry = config;
}

/**
 * Returns the registered ChainConfig singleton.
 * Throws if called before `registerAppConfig()`.
 */
export function getChainConfig(): IChainConfig {
  if (!_registry) {
    throw new Error(
      '[config] registerAppConfig() has not been called. ' +
      'Make sure to call it in your app root (providers.tsx) before any hooks.',
    );
  }
  return _registry.chainConfig;
}

/**
 * Returns the registered Contracts singleton.
 * Throws if called before `registerAppConfig()`.
 */
export function getRegisteredContracts(): ContractConfig {
  if (!_registry) {
    throw new Error(
      '[config] registerAppConfig() has not been called. ' +
      'Make sure to call it in your app root (providers.tsx) before any hooks.',
    );
  }
  return _registry.contracts;
}

/**
 * Returns the registered Endpoints singleton.
 * Throws if called before `registerAppConfig()`.
 */
export function getRegisteredEndpoints(): EndpointConfig {
  if (!_registry) {
    throw new Error(
      '[config] registerAppConfig() has not been called. ' +
      'Make sure to call it in your app root (providers.tsx) before any hooks.',
    );
  }
  return _registry.endpoints;
}

/**
 * Proxy objects that packages can use as named constants matching the old
 * `ChainConfig`, `Contracts`, `Endpoints` import style. Reads from the
 * registry lazily so the import itself does not throw.
 */
export const ChainConfig: IChainConfig = new Proxy({} as IChainConfig, {
  get(_target, prop: string) {
    return getChainConfig()[prop as keyof IChainConfig];
  },
});

export const Contracts: ContractConfig = new Proxy({} as ContractConfig, {
  get(_target, prop) {
    return getRegisteredContracts()[prop as unknown as number];
  },
  ownKeys() {
    return Reflect.ownKeys(getRegisteredContracts());
  },
  has(_target, prop) {
    return prop in getRegisteredContracts();
  },
  getOwnPropertyDescriptor(_target, prop) {
    return Object.getOwnPropertyDescriptor(getRegisteredContracts(), prop);
  },
});

export const Endpoints: EndpointConfig = new Proxy({} as EndpointConfig, {
  get(_target, prop: string) {
    return getRegisteredEndpoints()[prop as keyof EndpointConfig];
  },
});
