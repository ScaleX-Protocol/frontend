/**
 * @scalex/service-wallet – Endpoint config
 *
 * Re-exports the platform-agnostic factory and type from @scalex/config.
 * Each app (web/mobile) creates its own Endpoints instance by calling
 * createEndpoints() with its own env vars — no hardcoding here.
 */
export type { EndpointConfig } from '@scalex/config';
export { createEndpoints } from '@scalex/config';
