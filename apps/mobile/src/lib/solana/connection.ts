import { Connection } from '@solana/web3.js';
import { SOLANA_CONFIG } from '../../config/solana';

let _connection: Connection | null = null;

/**
 * Get or create a Solana connection (devnet)
 */
export function getSolanaConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_CONFIG.rpc, {
      commitment: 'confirmed',
      confirmTransactionInitialTimeout: 60000,
    });
  }
  return _connection;
}
