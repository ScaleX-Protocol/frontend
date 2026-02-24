/**
 * Solana / OpenBook v2 program configuration
 * Network: devnet
 */
export const SOLANA_CONFIG = {
  network: 'devnet',
  rpc:
    process.env.EXPO_PUBLIC_SOLANA_RPC_URL ??
    'https://devnet.helius-rpc.com/?api-key=e8252302-cdec-44d0-80d2-3efac7c0b50c',
  programId: 'GesS1wVm85uRvvjYDAgCVK9MJU5icjsX3LX6GMfibKW1',
  markets: {
    BTC_USDT: 'A2Acd4esd1h6x3AH6GBTHQKgd3789NHorJdQzRMDHRkK',
    WETH_USDT: 'FvV13csBHriHVNmJ7YzF1GXugRiniFPCGFmVquf7jkkD',
  } as Record<string, string>,
  tokens: {
    BTC: 'VJdwDEtpbQcP1xoJVtwUQ3EVhoxhid7LcEMfRtqmcGu',
    USDT: 'Fx4eqJMFpVtKt7Z27DqaU1QRTX4hKvsustzDyRZDNo7M',
    WETH: '4WxBZ9A5ZPqjvbAWMuHUzDGge1SuamWZM23dwB9c3S8n',
  } as Record<string, string>,
  /** Vault / escrow that receives deposits; update with your program's deposit vault */
  depositVaultAddress: process.env.EXPO_PUBLIC_DEPOSIT_VAULT ?? '',
} as const;

export type MarketSymbol = keyof typeof SOLANA_CONFIG.markets;
