'use client';

/**
 * Web platform transaction executor – Privy Embedded Wallet
 *
 * This hook provides a `TxExecutor` function that uses the Privy embedded
 * wallet (@privy-io/react-auth) to sign and send transactions on EVM chains.
 *
 * Usage:
 *   const { executor, address, isReady } = usePrivyTxExecutor();
 *   const { borrow } = useBorrow({ executor, address, isReady });
 */

import { useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import type { TxExecutor, EvmTransactionInstruction, TransactionInstruction } from '@scalex/transaction';

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
  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // Get the embedded wallet (first wallet from Privy)
  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === 'privy'
  );
  const address = embeddedWallet?.address || user?.wallet?.address;

  const isReady = ready && authenticated && !!embeddedWallet && !!address;

  /**
   * Execute an EVM transaction instruction using the Privy embedded wallet.
   * Handles: chain switching → simulation → signing → sending → confirmation.
   */
  const executor: TxExecutor = useCallback(
    async (instruction: TransactionInstruction): Promise<string> => {
      if (instruction.chain !== 'evm') {
        throw new Error(
          `[usePrivyTxExecutor] Unsupported chain "${instruction.chain}". ` +
            'Solana executor is not yet implemented.'
        );
      }

      const evmInstruction = instruction as EvmTransactionInstruction;

      if (!embeddedWallet || !address) {
        throw new Error('Wallet not connected or not ready');
      }

      const targetChainId = evmInstruction.chainId ?? 84532;

      // 1. Switch to target chain if needed
      try {
        await embeddedWallet.switchChain(targetChainId);
      } catch {
        try {
          const chainConfig = getViemChain(targetChainId);
          const provider = await embeddedWallet.getEthereumProvider();

          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: `0x${targetChainId.toString(16)}`,
                chainName: chainConfig.name,
                nativeCurrency: chainConfig.nativeCurrency,
                rpcUrls: chainConfig.rpcUrls.default.http,
                blockExplorerUrls: chainConfig.blockExplorers
                  ? [chainConfig.blockExplorers.default.url]
                  : [],
              },
            ],
          });

          await embeddedWallet.switchChain(targetChainId);
        } catch (addError) {
          throw new Error(
            `Failed to switch to chain ${targetChainId}: ${(addError as Error).message}`
          );
        }
      }

      // 2. Get provider and create wallet client
      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(targetChainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      // 3. Simulate transaction to catch errors early
      try {
        await walletClient.simulateContract({
          address: evmInstruction.to,
          abi: evmInstruction.abi as any,
          functionName: evmInstruction.functionName,
          args: evmInstruction.args as any,
          account: address as `0x${string}`,
          value: evmInstruction.value,
        });
        console.log('[usePrivyTxExecutor] Simulation successful');
      } catch (simulationError: any) {
        console.error('[usePrivyTxExecutor] Simulation failed:', simulationError.message);

        // Extract meaningful error message from viem error chain
        let errorMessage = 'Unknown reason';
        let currentError = simulationError;

        while (currentError) {
          const errorName = currentError.name || currentError.cause?.name;
          if (
            errorName &&
            errorName !== 'Error' &&
            errorName !== 'ContractFunctionRevertedError'
          ) {
            errorMessage = `Contract error: ${errorName}`;
            break;
          }
          currentError = currentError.cause;
        }

        if (errorMessage === 'Unknown reason') {
          errorMessage =
            simulationError.shortMessage ||
            simulationError.message ||
            'Transaction simulation failed';
        }

        throw new Error(`Transaction will fail: ${errorMessage}`);
      }

      // 4. Execute the contract call
      const txHash = await walletClient.writeContract({
        address: evmInstruction.to,
        abi: evmInstruction.abi as any,
        functionName: evmInstruction.functionName,
        args: evmInstruction.args as any,
        value: evmInstruction.value,
      });

      console.log('[usePrivyTxExecutor] Transaction submitted:', txHash);

      // 5. Wait for confirmation
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000,
      });

      if (txReceipt.status === 'reverted') {
        // Try to get revert reason
        try {
          const tx = await walletClient.getTransaction({ hash: txHash });
          if (tx) {
            await walletClient.call({
              to: tx.to,
              data: tx.input,
              value: tx.value,
            });
          }
        } catch (callError: unknown) {
          const errorObj = callError as { data?: { data?: string }; message?: string };
          const revertReason =
            errorObj?.data?.data || errorObj?.message || 'Unknown revert reason';
          throw new Error(`Transaction failed: ${revertReason}`);
        }
        throw new Error('Transaction reverted on-chain');
      }

      console.log('[usePrivyTxExecutor] Transaction confirmed:', txReceipt.transactionHash);

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
