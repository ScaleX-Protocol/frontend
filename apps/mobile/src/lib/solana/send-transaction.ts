/**
 * Send a Solana transaction via Privy embedded wallet.
 */
import {
  Transaction,
  TransactionInstruction,
  PublicKey,
} from '@solana/web3.js';
import { getSolanaConnection } from './connection';

export interface SendTxParams {
  instructions: TransactionInstruction[];
  feePayer: PublicKey;
  provider: { request: (args: { method: string; params?: unknown }) => Promise<unknown> };
}

/**
 * Build a legacy Transaction, sign and send via Privy provider.
 * Returns the transaction signature.
 */
export async function sendTransactionViaPrivy(
  params: SendTxParams
): Promise<string> {
  const { instructions, feePayer, provider } = params;
  const connection = getSolanaConnection();

  const tx = new Transaction();
  tx.add(...instructions);
  tx.feePayer = feePayer;
  tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;

  const result = await provider.request({
    method: 'signAndSendTransaction',
    params: {
      transaction: tx,
      connection,
    },
  });

  const sig = (result as { signature?: string })?.signature;
  if (!sig) {
    throw new Error('No signature returned from wallet');
  }
  return sig;
}
