/**
 * Mobile platform transaction executor – Privy Embedded Wallet
 *
 * This hook provides a `TxExecutor` function that uses the Privy embedded
 * wallet (@privy-io/expo) to sign and send transactions on EVM chains.
 *
 * Usage:
 *   const { executor, address, isReady } = usePrivyTxExecutor();
 *   const { borrow } = useBorrow({ executor, address, isReady });
 */

import { useCallback } from 'react';
import {
  usePrivy,
  useEmbeddedEthereumWallet,
} from '@privy-io/expo';
import {
  createWalletClient,
  custom,
  publicActions,
  createPublicClient,
  http,
} from 'viem';
import { baseSepolia } from 'viem/chains';
import type {
  TxExecutor,
  EvmTransactionInstruction,
  TransactionInstruction,
} from '@scalex/transaction';

// Map chain IDs to viem chain objects
const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 84532:
      return baseSepolia;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

export function usePrivyTxExecutor() {
  const privyContext = usePrivy() as ReturnType<typeof usePrivy> | null;
  const isPrivyReady = privyContext?.isReady ?? false;
  const user = privyContext?.user ?? null;

  const { wallets } = useEmbeddedEthereumWallet();
  const embeddedWallet = wallets?.[0];
  const address = embeddedWallet?.address;

  const isReady = isPrivyReady && !!user && !!embeddedWallet && !!address;

  /**
   * Execute an EVM transaction instruction using the Privy embedded wallet (Expo).
   * Handles: provider setup → simulation → signing → sending → confirmation.
   */
  const executor: TxExecutor = useCallback(
    async (instruction: TransactionInstruction): Promise<string> => {
      if (instruction.chain !== 'evm') {
        throw new Error(
          `[usePrivyTxExecutor] Unsupported chain "${instruction.chain}". ` +
            'Solana executor is not yet implemented for mobile.'
        );
      }

      const evmInstruction = instruction as EvmTransactionInstruction;

      if (!embeddedWallet || !address) {
        throw new Error('Wallet not connected or not ready');
      }

      const targetChainId = evmInstruction.chainId ?? 84532;
      const chainConfig = getViemChain(targetChainId);

      // 1. Get provider from embedded wallet
      const provider = await embeddedWallet.getProvider();

      // 2. Create wallet client
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      // 3. Simulate transaction
      try {
        await walletClient.simulateContract({
          address: evmInstruction.to,
          abi: evmInstruction.abi as any,
          functionName: evmInstruction.functionName,
          args: evmInstruction.args as any,
          account: address as `0x${string}`,
          value: evmInstruction.value,
        });
        console.log('[usePrivyTxExecutor.mobile] Simulation successful');
      } catch (simulationError: any) {
        console.error(
          '[usePrivyTxExecutor.mobile] Simulation failed:',
          simulationError.message
        );
        const errorMessage =
          simulationError.shortMessage ||
          simulationError.message ||
          'Transaction simulation failed';
        throw new Error(`Transaction will fail: ${errorMessage}`);
      }

      // 4. Execute transaction
      const txHash = await walletClient.writeContract({
        address: evmInstruction.to,
        abi: evmInstruction.abi as any,
        functionName: evmInstruction.functionName,
        args: evmInstruction.args as any,
        value: evmInstruction.value,
      });

      console.log('[usePrivyTxExecutor.mobile] Transaction submitted:', txHash);

      // 5. Wait for confirmation
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000,
      });

      if (txReceipt.status === 'reverted') {
        throw new Error('Transaction reverted on-chain');
      }

      console.log(
        '[usePrivyTxExecutor.mobile] Transaction confirmed:',
        txReceipt.transactionHash
      );

      return txHash;
    },
    [embeddedWallet, address]
  );

  return {
    /** TxExecutor function — pass this to package hooks */
    executor,
    /** User's wallet address */
    address,
    /** Whether the wallet is ready to execute transactions */
    isReady,
  };
}
