'use client';

import { parseContractError, validateWithdrawParams } from '@/utils/withdrawUtils';
import { useState, useCallback } from 'react';
import { formatUnits, getAddress, parseUnits } from 'viem';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { createWalletClient, custom, publicActions } from 'viem';
import { Contracts, BalanceManagerABI } from '@/configs/contracts';
import { ChainConfig, getViemChain } from '@/configs/chain';
import { logger } from '@/utils/prodLogger';

// Contract addresses from centralized config
const BALANCE_MANAGER_ADDRESSES = {
  84532: Contracts[84532].balanceManagerAddress
};

interface UseWithdrawOptions {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface WithdrawParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
  isSynthetic?: boolean; // Flag to indicate synthetic token withdrawal
  availableTokens?: any[]; // API data for synthetic token lookups
}

export enum WithdrawStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  WITHDRAWING = 'withdrawing',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

export function useWithdraw({ onSuccess, onError }: UseWithdrawOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hash, setHash] = useState<`0x${string}` | undefined>();
  const [currentStep, setCurrentStep] = useState<WithdrawStep>(WithdrawStep.IDLE);
  const [receipt, setReceipt] = useState<any | null>(null);
  const log = logger.withContext({ hook: 'useWithdraw' });

  const { ready, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // Get the embedded wallet (first wallet from Privy)
  const embeddedWallet = wallets.find(wallet => wallet.walletClientType === 'privy');
  const address = embeddedWallet?.address || user?.wallet?.address;

  // Utility functions
  const validateInputs = useCallback((params: WithdrawParams & { user: string }) => {
    log.debug('Validating withdraw inputs', { params });

    const validation = validateWithdrawParams(params);
    if (!validation.isValid) {
      const error = new Error(validation.error);
      log.error('Input validation failed', { validation, params });
      throw error;
    }

    if (!params.user) {
      const error = new Error('User address is required');
      log.error('Missing user address', { params });
      throw error;
    }

    log.debug('Input validation successful', { params });
  }, [log]);

  const getBalanceManagerAddress = useCallback((currentChainId: number) => {
    log.debug('Getting BalanceManager address', { currentChainId });

    const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[currentChainId as keyof typeof BALANCE_MANAGER_ADDRESSES];

    if (!balanceManagerAddress) {
      const availableChains = Object.keys(BALANCE_MANAGER_ADDRESSES);
      const error = new Error(`BalanceManager contract not found on chain ${currentChainId}. Available chains: ${availableChains.join(', ')}`);
      log.error('BalanceManager contract not found', { currentChainId, availableChains });
      throw error;
    }

    log.debug('BalanceManager address found', { balanceManagerAddress });
    return balanceManagerAddress;
  }, [log]);

  const prepareAddresses = useCallback((tokenAddress: string, user: string) => {
    log.debug('Preparing addresses', { tokenAddress, user });

    const checksumTokenAddress = getAddress(tokenAddress);
    const checksumUser = getAddress(user);

    log.debug('Addresses prepared', { checksumTokenAddress, checksumUser });
    return { checksumTokenAddress, checksumUser };
  }, [log]);

  // Chain switching function
  const switchWalletChain = useCallback(async (targetChainId: number) => {
    if (!embeddedWallet) {
      throw new Error('No embedded wallet available for chain switching');
    }

    try {
      await embeddedWallet.switchChain(targetChainId);
    } catch (error) {
      try {
        // Attempt to add chain if it doesn't exist
        const chainConfig = getViemChain(targetChainId);
        const provider = await embeddedWallet.getEthereumProvider();

        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${targetChainId.toString(16)}`,
            chainName: chainConfig.name,
            nativeCurrency: chainConfig.nativeCurrency,
            rpcUrls: chainConfig.rpcUrls.default.http,
            blockExplorerUrls: chainConfig.blockExplorers
              ? [chainConfig.blockExplorers.default.url]
              : [],
          }],
        });

        // Retry chain switching after adding
        await embeddedWallet.switchChain(targetChainId);
      } catch (addError) {
        throw new Error(`Failed to switch to chain ${targetChainId}: ${(addError as any).message}`);
      }
    }
  }, [embeddedWallet]);

  const checkBalance = useCallback(async (tokenAddress: string, userAddress: string, amount: bigint, availableTokens?: any[], targetChainId?: number) => {
    if (!embeddedWallet) {
      throw new Error('Wallet not available for balance check');
    }

    const chainId = targetChainId || ChainConfig.defaultChainId;

    try {
      // Switch to target chain if needed
      await switchWalletChain(chainId);

      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(chainId);
      const walletClient = createWalletClient({
        account: userAddress as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);


      // Find synthetic token address from API data for balance check
      if (!availableTokens) {
        throw new Error('availableTokens is required for balance check');
      }

      const syntheticToken = availableTokens.find(
        (token: any) => token.address?.toLowerCase() === tokenAddress.toLowerCase() &&
          token.tokenType === 'synthetic'
      );

      if (!syntheticToken) {
        throw new Error(`Synthetic token not found with address ${tokenAddress}. Please ensure this token is supported.`);
      }

      // Get BalanceManager address
      const balanceManagerAddress = getBalanceManagerAddress(chainId);

      // Check balance in BalanceManager contract (not synthetic token contract)
      // Synthetic token balances are tracked in BalanceManager using the synthetic token address as the key
      const syntheticTokenBalance = await walletClient.readContract({
        address: balanceManagerAddress as `0x${string}`,
        abi: BalanceManagerABI,
        functionName: 'getBalance',
        args: [userAddress as `0x${string}`, syntheticToken.address as `0x${string}`],
      }) as bigint;

      log.debug('Synthetic token balance check result', {
        userAddress,
        underlyingTokenAddress: tokenAddress,
        syntheticTokenAddress: syntheticToken.address,
        balanceManagerAddress,
        syntheticTokenBalance: syntheticTokenBalance.toString(),
        requestedAmount: amount.toString(),
        chainId
      });

      const availableBalance = syntheticTokenBalance;

      if (availableBalance < amount) {
        log.error('Insufficient synthetic token balance', {
          userAddress,
          syntheticTokenAddress: syntheticToken.address,
          balanceManagerAddress,
          available: availableBalance.toString(),
          requested: amount.toString(),
          chainId
        });

        // Provide a more helpful error message
        const availableFormatted = formatUnits(availableBalance, 6);
        const requestedFormatted = formatUnits(amount, 6);

        throw new Error(`Insufficient synthetic token balance. Available: ${availableFormatted} ${syntheticToken.symbol}, Requested: ${requestedFormatted} ${syntheticToken.symbol}. Please deposit funds to create synthetic tokens first.`);
      }

      return availableBalance;
    } catch (error) {
      log.error('Balance check failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, [embeddedWallet, switchWalletChain, getBalanceManagerAddress, parseUnits, log]);

  // Helper function to get underlying token address from synthetic token using API data
  const getUnderlyingTokenAddress = useCallback((syntheticTokenAddress: string, availableTokens: any[]): string => {
    // Find the synthetic token in the API data and return its underlying token address
    const syntheticToken = availableTokens.find(
      (token: any) =>
        token.tokenType === 'synthetic' &&
        token.address.toLowerCase() === syntheticTokenAddress.toLowerCase()
    );

    if (!syntheticToken) {
      throw new Error(`Synthetic token not found in available tokens: ${syntheticTokenAddress}`);
    }

    if (!syntheticToken.underlyingTokenAddress) {
      throw new Error(`No underlying token address found for synthetic token: ${syntheticToken.symbol}`);
    }

    return syntheticToken.underlyingTokenAddress;
  }, []);

  const executeTransaction = useCallback(async (contractCall: any, targetChainId?: number) => {
    if (!ready || !authenticated || !embeddedWallet || !address) {
      throw new Error('Wallet not connected or not ready');
    }

    const chainId = targetChainId || ChainConfig.defaultChainId;

    try {
      // Switch to target chain if needed
      await switchWalletChain(chainId);

      // Get provider from embedded wallet
      const provider = await embeddedWallet.getEthereumProvider();
      const chainConfig = getViemChain(chainId);
      const walletClient = createWalletClient({
        account: address as `0x${string}`,
        chain: chainConfig,
        transport: custom(provider),
      }).extend(publicActions);

      // Simulate transaction first to catch errors early
      setCurrentStep(WithdrawStep.VALIDATING);
      log.info('Simulating withdrawal transaction...', { chainId });

      try {
        await walletClient.simulateContract({
          address: contractCall.address,
          abi: contractCall.abi,
          functionName: contractCall.functionName,
          args: contractCall.args,
          account: address as `0x${string}`,
        });
        log.info('Withdrawal simulation successful', {});
      } catch (simulationError: any) {
        // Consolidated structured error logging for withdrawal simulation
        // Convert args to strings to avoid BigInt serialization issues
        const argsAsStrings = contractCall.args.map((arg: any) =>
          typeof arg === 'bigint' ? arg.toString() : arg
        );
        log.error('Withdrawal simulation failed', {
          errorMessage: simulationError.message || String(simulationError),
          errorName: simulationError.name,
          errorCause: simulationError.cause?.message || String(simulationError.cause || ''),
          errorDetails: simulationError.details,
          errorShortMessage: simulationError.shortMessage,
          contractCall: {
            address: contractCall.address,
            function: contractCall.functionName,
            args: argsAsStrings,
          },
          userAddress: address,
          chainId,
        });
        throw new Error(`Withdrawal will fail: ${simulationError.message || 'Unknown reason'}`);
      }

      // Execute the contract call
      setCurrentStep(WithdrawStep.WITHDRAWING);
      const txHash = await walletClient.writeContract({
        address: contractCall.address,
        abi: contractCall.abi,
        functionName: contractCall.functionName,
        args: contractCall.args,
      });

      log.info('Withdrawal transaction submitted', { txHash });
      setHash(txHash);

      // Wait for confirmation
      setCurrentStep(WithdrawStep.CONFIRMING);
      setIsConfirming(true);
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000, // 1 minute timeout
      });

      setIsConfirming(false);
      setReceipt(txReceipt);

      // Check transaction status
      if (txReceipt.status === 'reverted') {
        log.error('Transaction failed on-chain', { txHash });
        throw new Error('Transaction failed on-chain');
      }

      log.info('Transaction confirmed', { txHash: txReceipt.transactionHash });
      setCurrentStep(WithdrawStep.COMPLETED);
      setError(null);

      return txHash;

    } catch (error) {
      setIsConfirming(false);
      setCurrentStep(WithdrawStep.ERROR);
      log.error('Transaction failed', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }, [ready, authenticated, embeddedWallet, address, switchWalletChain, log]);

  const withdraw = useCallback(async ({
    tokenAddress,
    amount,
    decimals,
    isSynthetic = false,
    availableTokens,
  }: WithdrawParams) => {
    log.info('Withdraw started', { tokenAddress, amount, decimals, isSynthetic });

    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(WithdrawStep.VALIDATING);

      // Verify signer address exists
      if (!address) {
        const error = new Error('No connected wallet found - cannot determine signer address');
        log.error('Missing signer address', {});
        throw error;
      }

      // Validate inputs
      validateInputs({
        tokenAddress,
        amount,
        decimals,
        user: address
      });

      let checksumTokenAddress: string;
      let underlyingTokenAddress: string;

      if (isSynthetic) {
        // For synthetic tokens, tokenAddress is the synthetic token address
        // We need to find the underlying token address from the API data
        checksumTokenAddress = getAddress(tokenAddress);

        log.debug('Processing synthetic token withdrawal', {
          syntheticTokenAddress: checksumTokenAddress,
          availableTokensCount: availableTokens?.length || 0,
        });

        // Use the availableTokens passed in the parameters
        if (!availableTokens) {
          throw new Error('availableTokens is required for synthetic token withdrawals');
        }
        underlyingTokenAddress = getUnderlyingTokenAddress(checksumTokenAddress, availableTokens);

        log.debug('Found underlying token address', {
          syntheticTokenAddress: checksumTokenAddress,
          underlyingTokenAddress,
        });
      } else {
        // For regular tokens, use the token address directly
        checksumTokenAddress = getAddress(tokenAddress);
        underlyingTokenAddress = checksumTokenAddress;
      }

      // Prepare addresses and amounts
      const { checksumUser } = prepareAddresses(underlyingTokenAddress, address);
      const amountInWei = parseUnits(amount, decimals);
      const balanceManagerAddress = getBalanceManagerAddress(ChainConfig.defaultChainId);

      log.info('Processing withdrawal', {
        tokenAddress: checksumTokenAddress,
        underlyingTokenAddress,
        amount: amount.toString(),
        user: checksumUser,
        balanceManagerAddress,
        isSynthetic
      });

      // Check BalanceManager balance before proceeding
      setCurrentStep(WithdrawStep.VALIDATING);
      if (isSynthetic) {
        await checkBalance(checksumTokenAddress, checksumUser, amountInWei, availableTokens, ChainConfig.defaultChainId);
      } else {
        await checkBalance(underlyingTokenAddress, checksumUser, amountInWei, availableTokens, ChainConfig.defaultChainId);
      }

      // Execute withdrawal transaction (includes simulation, submission, and confirmation)
      // Note: The withdraw function expects the UNDERLYING token address in the Currency parameter
      // The contract looks up the synthetic token internally and uses it for balance tracking
      const txHash = await executeTransaction({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'withdraw',
        args: [
          underlyingTokenAddress, // Currency (underlying token address)
          amountInWei, // Amount
          checksumUser, // User address
        ],
      }, ChainConfig.defaultChainId);

      log.info('Withdrawal successful', { txHash });

      setIsPending(false);
      onSuccess?.(txHash as `0x${string}`);

      return txHash;

    } catch (err) {
      const parsedError = parseContractError(err);
      log.error('Withdrawal failed', { error: parsedError.message || parsedError, tokenAddress, amount, decimals, errorType: 'withdraw_function' });
      setIsPending(false);
      setCurrentStep(WithdrawStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  }, [ready, authenticated, embeddedWallet, address, switchWalletChain, validateInputs, prepareAddresses, getBalanceManagerAddress, parseUnits, getUnderlyingTokenAddress, executeTransaction, parseContractError, onSuccess, onError, log]);

  return {
    withdraw,
    isPending,
    isConfirming,
    isConfirmed: currentStep === WithdrawStep.COMPLETED,
    error,
    hash,
    currentStep,
    receipt,
    isAuthenticated: ready && authenticated && !!address,
    address,
  };
}

// Utility function to format token amount for display
export function formatTokenAmount(amount: bigint | undefined, decimals: number): string {
  if (!amount) return '0';
  return formatUnits(amount, decimals);
}