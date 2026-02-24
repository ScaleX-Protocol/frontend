/**
 * Solana / OpenBook v2 + Lending program configuration
 * Network: devnet
 * Program ID: GesS1wVm85uRvvjYDAgCVK9MJU5icjsX3LX6GMfibKW1
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
  /** Lending pool addresses (PDA: LendingPool + assetMint) */
  lendingPools: {
    BTC: '2ADwsjPQbYAYiYQnk39TLTk8EzW8nktmFMjuzVqRN9bU',
    USDT: '7zZDmcjG63CrjSiQtbpkNwS3ZGS7cZWBR68ZpQg5Ry2X',
    WETH: '9kDf27pPGZLs61WdVYV78spXmqqBbtBV93adKTEBuUin',
  } as Record<string, string>,
  /** Oracle addresses for lending price feeds */
  oracles: {
    BTC: '6wFi3nDMRNeKraGkqosgAgLZ8r181VWng8KBWYmEJcMg',
    USDT: 'DDmWhTuPu5eVcaftFp4vDt5VPQNq6XTQhbxQcJ88yH2E',
    WETH: '9Cw1kxstkoNCWrwkcP8uiRfDo5qh8hCsxxNYMjNFHwLd',
  } as Record<string, string>,
  /** Vault / escrow that receives deposits (legacy; lending uses pool vaults) */
  depositVaultAddress: process.env.EXPO_PUBLIC_DEPOSIT_VAULT ?? '',
} as const;

export type MarketSymbol = keyof typeof SOLANA_CONFIG.markets;
