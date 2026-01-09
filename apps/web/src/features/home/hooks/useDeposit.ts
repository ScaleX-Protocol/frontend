'use client';

import { parseContractError, validateDepositParams, formatTokenAmount } from '@/utils/depositUtils';
import { useState, useCallback } from 'react';
import { formatUnits, getAddress, parseUnits, erc20Abi, createWalletClient, custom, publicActions } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Contracts, BalanceManagerABI } from '@/configs/contracts';
import { useLogger } from '@/hooks/useLogger';
import { LogLevel, LogLabel, ServiceName } from '@/utils/logger';
import { useWallets } from '@privy-io/react-auth';
import { useWalletState, ChainConfig } from '@scalex/service-wallet';

// Contract addresses from centralized config
const BALANCE_MANAGER_ADDRESSES = {
  84532: Contracts[84532].balanceManagerAddress
};


interface UseDepositOptions {
  onSuccess?: (hash: `0x${string}`) => void;
  onError?: (error: Error) => void;
}

interface DepositParams {
  tokenAddress: string;
  amount: string;
  decimals: number;
  recipient?: string;
}

type TokenType = 'ETH' | 'ERC20';

export enum DepositStep {
  IDLE = 'idle',
  VALIDATING = 'validating',
  APPROVING = 'approving',
  DEPOSITING = 'depositing',
  CONFIRMING = 'confirming',
  COMPLETED = 'completed',
  ERROR = 'error',
}

// Map chain IDs to viem chain objects
const getViemChain = (chainId: number) => {
  switch (chainId) {
    case 84532:
      return baseSepolia;
    default:
      throw new Error(`Unsupported chain ID: ${chainId}`);
  }
};

export function useDeposit({ onSuccess, onError }: UseDepositOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.IDLE);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  // Get wallets from Privy
  const { wallets } = useWallets();
  const wallet = useWalletState();

  // Get the external wallet (MetaMask) for signing transactions
  const externalWallet = wallets.find(w => w.walletClientType !== 'privy');
  const signerAddress = externalWallet?.address as `0x${string}` | undefined;

  // Get chain ID from wallet state
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;

  // Initialize logger with wallet context
  const logger = useLogger();

  // Utility functions
const getTokenType = (tokenAddress: string): TokenType => {
  return tokenAddress === '0x0000000000000000000000000000000000000000' ? 'ETH' : 'ERC20';
};

const validateInputs = useCallback((params: DepositParams & { recipient: string }) => {
  logger.log(LogLevel.DEBUG, 'Validating deposit inputs', LogLabel.DEPOSIT, ServiceName.WEBAPP, { params }, 'useDeposit.ts', 'validateInputs');

  const validation = validateDepositParams(params);
  if (!validation.isValid) {
    const error = new Error(validation.error);
    logger.log(LogLevel.ERROR, 'Input validation failed', LogLabel.DEPOSIT, ServiceName.WEBAPP, { validation }, 'useDeposit.ts', 'validateInputs');
    throw error;
  }

  if (!params.recipient) {
    const error = new Error('Recipient address is required');
    logger.log(LogLevel.ERROR, 'Missing recipient address', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'validateInputs');
    throw error;
  }

  logger.log(LogLevel.DEBUG, 'Input validation successful', LogLabel.DEPOSIT, ServiceName.WEBAPP, { params }, 'useDeposit.ts', 'validateInputs');
}, [logger]);

const getBalanceManagerAddress = useCallback((currentChainId: number) => {
  logger.log(LogLevel.DEBUG, 'Getting BalanceManager address', LogLabel.DEPOSIT, ServiceName.WEBAPP, { currentChainId }, 'useDeposit.ts', 'getBalanceManagerAddress');

  const balanceManagerAddress = BALANCE_MANAGER_ADDRESSES[currentChainId as keyof typeof BALANCE_MANAGER_ADDRESSES];

  if (!balanceManagerAddress) {
    const availableChains = Object.keys(BALANCE_MANAGER_ADDRESSES);
    const error = new Error(`BalanceManager contract not found on chain ${currentChainId}. Available chains: ${availableChains.join(', ')}`);
    logger.log(LogLevel.ERROR, 'BalanceManager contract not found', LogLabel.DEPOSIT, ServiceName.WEBAPP, { currentChainId, availableChains }, 'useDeposit.ts', 'getBalanceManagerAddress');
    throw error;
  }

  logger.log(LogLevel.DEBUG, 'BalanceManager address found', LogLabel.DEPOSIT, ServiceName.WEBAPP, { balanceManagerAddress }, 'useDeposit.ts', 'getBalanceManagerAddress');
  return balanceManagerAddress;
}, [logger]);

const prepareAddresses = useCallback((tokenAddress: string, recipient: string) => {
  logger.log(LogLevel.DEBUG, 'Preparing addresses', LogLabel.DEPOSIT, ServiceName.WEBAPP, { tokenAddress, recipient }, 'useDeposit.ts', 'prepareAddresses');

  const checksumTokenAddress = getAddress(tokenAddress);
  const checksumRecipient = getAddress(recipient);

  logger.log(LogLevel.DEBUG, 'Addresses prepared', LogLabel.DEPOSIT, ServiceName.WEBAPP, { checksumTokenAddress, checksumRecipient }, 'useDeposit.ts', 'prepareAddresses');
  return { checksumTokenAddress, checksumRecipient };
}, [logger]);

  // Helper to get wallet client from external wallet
  const getWalletClient = useCallback(async () => {
    if (!externalWallet || !signerAddress) {
      throw new Error('External wallet not available');
    }

    const provider = await externalWallet.getEthereumProvider();
    const chainConfig = getViemChain(chainId);

    return createWalletClient({
      account: signerAddress,
      chain: chainConfig,
      transport: custom(provider),
    }).extend(publicActions);
  }, [externalWallet, signerAddress, chainId]);

  const deposit = async ({
    tokenAddress,
    amount,
    decimals,
    recipient,
  }: DepositParams) => {
    logger.log(LogLevel.INFO, 'Deposit started', LogLabel.DEPOSIT, ServiceName.WEBAPP, { tokenAddress, amount, decimals, recipient }, 'useDeposit.ts', 'deposit');

    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(DepositStep.VALIDATING);

      if (!recipient) {
        const error = new Error('Recipient address is required');
        logger.log(LogLevel.ERROR, 'Missing recipient address', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'deposit');
        throw error;
      }

      // Validate inputs
      validateInputs({
        tokenAddress,
        amount,
        decimals,
        recipient
      });

      // Prepare addresses and amounts
      const { checksumTokenAddress, checksumRecipient } = prepareAddresses(tokenAddress, recipient);
      const amountInWei = parseUnits(amount, decimals);
      const balanceManagerAddress = getBalanceManagerAddress(chainId);

      // Verify signer address exists
      if (!signerAddress) {
        const error = new Error('No connected wallet found - cannot determine signer address');
        logger.log(LogLevel.ERROR, 'Missing signer address', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'deposit');
        throw error;
      }

      // Determine token type and process accordingly
      const tokenType = getTokenType(tokenAddress);

      logger.log(LogLevel.INFO, 'Processing deposit', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        tokenType,
        tokenAddress: checksumTokenAddress,
        amount: amount.toString(),
        recipient: checksumRecipient,
        balanceManagerAddress
      }, 'useDeposit.ts', 'deposit');

      if (tokenType === 'ETH') {
        await processETHDeposit({
          balanceManagerAddress,
          checksumTokenAddress,
          checksumRecipient,
          amountInWei,
          chainId,
          signerAddress: signerAddress as `0x${string}`
        });
      } else {
        await processERC20Deposit({
          balanceManagerAddress,
          checksumTokenAddress,
          checksumRecipient,
          amountInWei,
          decimals,
          chainId,
          signerAddress: signerAddress as `0x${string}`
        });
      }

    } catch (err) {
      const parsedError = parseContractError(err);
      logger.logError('Deposit failed', { error: parsedError.message || parsedError, tokenAddress, amount, decimals, recipient, errorType: 'deposit_function' }, 'deposit', 'useDeposit.ts');
      setIsPending(false);
      setIsApproving(false);
      setCurrentStep(DepositStep.ERROR);
      setError(parsedError);
      onError?.(parsedError);
      throw parsedError;
    }
  };

  // Separate functions for different deposit types
  const processETHDeposit = async ({
    balanceManagerAddress,
    checksumTokenAddress,
    checksumRecipient,
    amountInWei,
    chainId,
    signerAddress
  }: {
    balanceManagerAddress: `0x${string}`;
    checksumTokenAddress: `0x${string}`;
    checksumRecipient: `0x${string}`;
    amountInWei: bigint;
    chainId: number;
    signerAddress: `0x${string}`;
  }) => {
    // Get wallet client from external wallet
    const walletClient = await getWalletClient();

    logger.log(LogLevel.INFO, 'Simulating ETH deposit transaction...', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        balanceManagerAddress,
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient
      }, 'useDeposit.ts', 'processETHDeposit');

    try {
      await walletClient.simulateContract({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'deposit',
        args: [
          checksumTokenAddress,
          amountInWei,
          checksumRecipient,
          checksumRecipient,
        ],
        value: amountInWei,
        account: signerAddress,
      });

      logger.log(LogLevel.INFO, 'ETH deposit simulation successful', LogLabel.CONTRACT, ServiceName.WEBAPP, {
        contractName: 'BalanceManager',
        functionName: 'deposit',
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient
      }, 'useDeposit.ts', 'processETHDeposit');
    } catch (simulationError: any) {
      logger.log(LogLevel.ERROR, 'ETH deposit simulation failed', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        error: simulationError.message || 'Unknown reason',
        balanceManagerAddress,
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient,
        signerAddress,
        errorType: 'simulation'
      }, 'useDeposit.ts', 'processETHDeposit');
      throw new Error(`ETH deposit will fail: ${simulationError.message || 'Unknown reason'}`);
    }

    setCurrentStep(DepositStep.DEPOSITING);

    const txHash = await walletClient.writeContract({
      address: balanceManagerAddress,
      abi: BalanceManagerABI,
      functionName: 'deposit',
      args: [
        checksumTokenAddress, // Currency (address)
        amountInWei, // Amount
        checksumRecipient, // From (user address)
        checksumRecipient, // To (user address)
      ],
      value: amountInWei,
    });

    logger.log(LogLevel.INFO, 'ETH deposit transaction submitted', LogLabel.DEPOSIT, ServiceName.WEBAPP, { txHash }, 'useDeposit.ts', 'processETHDeposit');
    setHash(txHash);

    // Wait for confirmation
    setCurrentStep(DepositStep.CONFIRMING);
    const txReceipt = await walletClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000,
    });

    if (txReceipt.status === 'reverted') {
      throw new Error('ETH deposit transaction reverted on-chain');
    }

    logger.log(LogLevel.INFO, 'ETH deposit transaction confirmed', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
      txHash,
      blockNumber: txReceipt.blockNumber
    }, 'useDeposit.ts', 'processETHDeposit');

    setCurrentStep(DepositStep.COMPLETED);
    setError(null);
    onSuccess?.(txHash);
  };

  const processERC20Deposit = async ({
    balanceManagerAddress,
    checksumTokenAddress,
    checksumRecipient,
    amountInWei,
    decimals,
    chainId,
    signerAddress
  }: {
    balanceManagerAddress: `0x${string}`;
    checksumTokenAddress: `0x${string}`;
    checksumRecipient: `0x${string}`;
    amountInWei: bigint;
    decimals: number;
    chainId: number;
    signerAddress: `0x${string}`;
  }) => {
    // Get wallet client from external wallet
    const walletClient = await getWalletClient();

    // ========================================
    // STEP 1: Check existing allowance first
    // ========================================
    logger.log(LogLevel.INFO, 'Checking current token allowance...', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        tokenAddress: checksumTokenAddress,
        signerAddress,
        balanceManagerAddress,
        decimals
      }, 'useDeposit.ts', 'processERC20Deposit');

    let currentAllowance: bigint;
    try {
      currentAllowance = await walletClient.readContract({
        address: checksumTokenAddress,
        abi: erc20Abi,
        functionName: 'allowance',
        args: [signerAddress, balanceManagerAddress],
      }) as bigint;

      const currentAllowanceFormatted = formatUnits(currentAllowance, decimals);
      const requiredAmountFormatted = formatUnits(amountInWei, decimals);

      logger.log(LogLevel.INFO, 'Token allowance check completed', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
        currentAllowance: currentAllowanceFormatted,
        requiredAmount: requiredAmountFormatted,
        isSufficient: currentAllowance >= amountInWei,
        tokenAddress: checksumTokenAddress
      }, 'useDeposit.ts', 'processERC20Deposit');
    } catch (error) {
      logger.logError('Failed to check current allowance', {
        error: error instanceof Error ? error.message : String(error),
        tokenAddress: checksumTokenAddress,
        signerAddress,
        balanceManagerAddress
      }, 'processERC20Deposit', 'useDeposit.ts');
      throw new Error(`Cannot verify token allowance: ${(error as Error).message}`);
    }

    // ========================================
    // STEP 2: Only approve if needed
    // ========================================
    if (currentAllowance < amountInWei) {
      setCurrentStep(DepositStep.APPROVING);
      setIsApproving(true);

      try {
        // Calculate approval amount
        // Strategy: Approve unlimited for best UX (one-time approval)
        // Alternative: Use amountInWei for exact amount, or amountInWei * 10n for buffered
        const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1);
        const approvalAmount = maxUint256;

        logger.log(LogLevel.INFO, `Insufficient allowance. Requesting approval for ${approvalAmount === maxUint256 ? 'unlimited' : formatUnits(approvalAmount, decimals)} tokens`, LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalAmount: approvalAmount.toString(),
        amountInWei: amountInWei.toString(),
        isUnlimited: approvalAmount === maxUint256
      }, 'useDeposit.ts', 'processERC20Deposit');

        // Simulate approval transaction first to catch errors early
        logger.log(LogLevel.INFO, 'Simulating approval transaction...', LogLabel.APPROVAL, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');
        try {
          await walletClient.simulateContract({
            address: checksumTokenAddress,
            abi: erc20Abi,
            functionName: 'approve',
            args: [balanceManagerAddress, approvalAmount],
            account: signerAddress,
          });
          logger.log(LogLevel.INFO, 'Approval simulation successful', LogLabel.APPROVAL, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');
        } catch (simulationError: any) {
          logger.logError('Approval simulation failed', {
            error: simulationError.message || 'Unknown reason'
          }, 'processERC20Deposit', 'useDeposit.ts');
          throw new Error(`Approval will fail: ${simulationError.message || 'Unknown reason'}`);
        }

        // Submit approval transaction using wallet client
        const approvalHash = await walletClient.writeContract({
          address: checksumTokenAddress,
          abi: erc20Abi,
          functionName: 'approve',
          args: [balanceManagerAddress, approvalAmount],
        });

        logger.log(LogLevel.INFO, `Approval transaction submitted: ${approvalHash}`, LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalHash,
        tokenAddress: checksumTokenAddress
      }, 'useDeposit.ts', 'processERC20Deposit');

        // Wait for approval transaction to confirm
        logger.log(LogLevel.INFO, 'Waiting for approval transaction confirmation...', LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalHash
      }, 'useDeposit.ts', 'processERC20Deposit');
        const approvalReceipt = await walletClient.waitForTransactionReceipt({
          hash: approvalHash,
          confirmations: 1,
        });

        if (approvalReceipt.status === 'reverted') {
          throw new Error('Approval transaction reverted on-chain');
        }

        logger.log(LogLevel.INFO, 'Approval transaction confirmed', LogLabel.APPROVAL, ServiceName.WEBAPP, {
        approvalHash,
        status: approvalReceipt?.status
      }, 'useDeposit.ts', 'processERC20Deposit');

        // Note: Skipping allowance verification as transaction receipt confirmation is sufficient.
        // Immediate allowance reads can return stale/cached RPC state, causing false negatives.
        // The transaction receipt status already confirms the approval succeeded on-chain.
        logger.log(LogLevel.INFO, 'Token approval successful - proceeding with deposit', LogLabel.APPROVAL, ServiceName.WEBAPP, {
          tokenAddress: checksumTokenAddress,
          approvalHash
        }, 'useDeposit.ts', 'processERC20Deposit');

      } catch (approvalError: any) {
        logger.logError('Token approval failed', {
          error: approvalError.message || approvalError
        }, 'processERC20Deposit', 'useDeposit.ts');
        throw new Error(`Token approval failed: ${approvalError.message}`);
      } finally {
        setIsApproving(false);
      }
    } else {
      logger.log(LogLevel.INFO, 'Sufficient allowance already exists, skipping approval step', LogLabel.APPROVAL, ServiceName.WEBAPP, {
        currentAllowance: currentAllowance.toString(),
        requiredAmount: amountInWei.toString(),
        tokenAddress: checksumTokenAddress
      }, 'useDeposit.ts', 'processERC20Deposit');
    }

    // ========================================
    // STEP 3: Check signer's token balance before proceeding with deposit
    // ========================================
    try {
      const balance = await walletClient.readContract({
        address: checksumTokenAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [signerAddress]
      }) as bigint;

      logger.log(LogLevel.INFO, `Token balance: ${formatUnits(balance, decimals)}`, LogLabel.BALANCE, ServiceName.WEBAPP, {
        balance: balance.toString(),
        decimals
      }, 'useDeposit.ts', 'processERC20Deposit');

      if (balance < amountInWei) {
        logger.logError('Insufficient token balance', {
          required: formatUnits(amountInWei, decimals),
          available: formatUnits(balance, decimals),
          tokenAddress: checksumTokenAddress
        }, 'processERC20Deposit', 'useDeposit.ts');
        throw new Error(`Insufficient token balance. Required: ${formatUnits(amountInWei, decimals)}, Available: ${formatUnits(balance, decimals)}`);
      }

    } catch (balanceError: unknown) {
      const error = balanceError as Error;
      logger.logError('Balance verification failed', {
        error: error.message || 'Unknown error'
      }, 'processERC20Deposit', 'useDeposit.ts');
      throw new Error(`Balance verification failed: ${error.message}`);
    }

    // ========================================
    // STEP 4: Simulate deposit transaction
    // ========================================
    logger.log(LogLevel.INFO, 'Simulating ERC-20 deposit transaction...', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');
    try {
      await walletClient.simulateContract({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: 'depositLocal',
        args: [
          checksumTokenAddress,
          amountInWei,
          checksumRecipient,
        ],
        account: signerAddress,
      });
      logger.log(LogLevel.INFO, 'ERC-20 deposit simulation successful', LogLabel.CONTRACT, ServiceName.WEBAPP, {
        contractName: 'BalanceManager',
        functionName: 'depositLocal',
        checksumTokenAddress,
        amountInWei: amountInWei.toString(),
        checksumRecipient
      }, 'useDeposit.ts', 'processERC20Deposit');
    } catch (simulationError: any) {
      logger.logError('ERC-20 deposit simulation failed', {
        error: simulationError.message || 'Unknown reason'
      }, 'processERC20Deposit', 'useDeposit.ts');
      throw new Error(`Deposit will fail: ${simulationError.message || 'Unknown reason'}`);
    }

    // ========================================
    // STEP 5: Execute deposit transaction
    // ========================================
    setCurrentStep(DepositStep.DEPOSITING);
    logger.log(LogLevel.INFO, 'Submitting deposit transaction', LogLabel.DEPOSIT, ServiceName.WEBAPP, {}, 'useDeposit.ts', 'processERC20Deposit');

    const txHash = await walletClient.writeContract({
      address: balanceManagerAddress,
      abi: BalanceManagerABI,
      functionName: 'depositLocal',
      args: [
        checksumTokenAddress, // Token address
        amountInWei, // Amount
        checksumRecipient, // Recipient
      ],
    });

    logger.log(LogLevel.INFO, 'Deposit transaction submitted', LogLabel.DEPOSIT, ServiceName.WEBAPP, { txHash }, 'useDeposit.ts', 'processERC20Deposit');
    setHash(txHash);

    // Wait for confirmation
    setCurrentStep(DepositStep.CONFIRMING);
    const txReceipt = await walletClient.waitForTransactionReceipt({
      hash: txHash,
      timeout: 60_000,
    });

    if (txReceipt.status === 'reverted') {
      throw new Error('Deposit transaction reverted on-chain');
    }

    logger.log(LogLevel.INFO, 'Deposit transaction confirmed', LogLabel.DEPOSIT, ServiceName.WEBAPP, {
      txHash,
      blockNumber: txReceipt.blockNumber
    }, 'useDeposit.ts', 'processERC20Deposit');

    setCurrentStep(DepositStep.COMPLETED);
    setError(null);
    onSuccess?.(txHash);
  };


  return {
    deposit,
    isPending,
    isApproving,
    isConfirming: currentStep === DepositStep.CONFIRMING,
    isConfirmed: currentStep === DepositStep.COMPLETED,
    error,
    hash,
    currentStep,
  };
}


// Utility function to check if user needs to approve tokens
export function needsApproval(
  tokenAddress: string,
  amount: string,
  decimals: number,
  allowance?: bigint
): boolean {
  // ETH doesn't need approval
  if (tokenAddress === '0x0000000000000000000000000000000000000000') {
    return false;
  }

  // If no allowance or insufficient allowance, approval is needed
  if (!allowance) {
    return true;
  }

  const amountInWei = parseUnits(amount, decimals);
  return allowance < amountInWei;
}