import { useState, useCallback } from "react";
import { usePrivy, useEmbeddedEthereumWallet } from "@privy-io/expo";
import {
  createWalletClient,
  custom,
  publicActions,
  createPublicClient,
  http,
  parseUnits,
  formatUnits,
  getAddress,
  erc20Abi,
} from "viem";
import { baseSepolia } from "viem/chains";
import { Contracts, BalanceManagerABI, CHAIN_ID } from "../config/contracts";

export enum DepositStep {
  IDLE = "idle",
  VALIDATING = "validating",
  APPROVING = "approving",
  DEPOSITING = "depositing",
  CONFIRMING = "confirming",
  COMPLETED = "completed",
  ERROR = "error",
}

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

export function useDepositMobile({
  onSuccess,
  onError,
}: UseDepositOptions = {}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentStep, setCurrentStep] = useState<DepositStep>(DepositStep.IDLE);
  const [hash, setHash] = useState<`0x${string}` | undefined>();

  const { isReady, user } = usePrivy();
  const { wallets } = useEmbeddedEthereumWallet();

  // Get the embedded wallet
  const embeddedWallet = wallets?.[0];
  const address = embeddedWallet?.address;

  // Helper to get public client for read operations
  const getPublicClient = useCallback(() => {
    return createPublicClient({
      chain: baseSepolia,
      transport: http(),
    });
  }, []);

  // Helper to get wallet client for write operations
  const getWalletClient = useCallback(async () => {
    if (!embeddedWallet || !address) {
      throw new Error("Wallet not connected");
    }

    const provider = await embeddedWallet.getProvider();

    return createWalletClient({
      account: address as `0x${string}`,
      chain: baseSepolia,
      transport: custom(provider),
    }).extend(publicActions);
  }, [embeddedWallet, address]);

  const deposit = async ({
    tokenAddress,
    amount,
    decimals,
    recipient,
  }: DepositParams) => {
    try {
      // Initialize state
      setIsPending(true);
      setError(null);
      setCurrentStep(DepositStep.VALIDATING);

      if (!isReady || !embeddedWallet || !address) {
        throw new Error("Please connect your wallet first");
      }

      // Validate inputs
      if (!tokenAddress || !amount || parseFloat(amount) <= 0) {
        throw new Error("Invalid deposit parameters");
      }

      // Use embedded wallet address as recipient if not provided
      const recipientAddress = recipient || address;

      // Prepare addresses and amounts
      const checksumTokenAddress = getAddress(tokenAddress);
      const checksumRecipient = getAddress(recipientAddress);
      const amountInWei = parseUnits(amount, decimals);
      const balanceManagerAddress = Contracts.balanceManagerAddress;

      console.log("[Deposit] Starting deposit:", {
        token: checksumTokenAddress,
        amount: amount,
        amountInWei: amountInWei.toString(),
        recipient: checksumRecipient,
      });

      // Get public client for balance checks
      const publicClient = getPublicClient();

      // ========================================
      // STEP 1: Check allowance
      // ========================================
      console.log("[Deposit] Checking token allowance...");
      const currentAllowance = (await publicClient.readContract({
        address: checksumTokenAddress,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as `0x${string}`, balanceManagerAddress],
      })) as bigint;

      console.log(
        "[Deposit] Current allowance:",
        formatUnits(currentAllowance, decimals),
      );

      // ========================================
      // STEP 2: Approve if needed
      // ========================================
      if (currentAllowance < amountInWei) {
        console.log("[Deposit] Insufficient allowance, requesting approval...");
        setCurrentStep(DepositStep.APPROVING);

        const walletClient = await getWalletClient();

        // Approve unlimited amount for better UX (one-time approval)
        const maxUint256 = BigInt(2) ** BigInt(256) - BigInt(1);

        try {
          // Simulate approval first
          await walletClient.simulateContract({
            address: checksumTokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [balanceManagerAddress, maxUint256],
            account: address as `0x${string}`,
          });

          console.log("[Deposit] Approval simulation successful");

          // Execute approval
          const approvalHash = await walletClient.writeContract({
            address: checksumTokenAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [balanceManagerAddress, maxUint256],
          });

          console.log(
            "[Deposit] Approval transaction submitted:",
            approvalHash,
          );

          // Wait for approval confirmation
          const approvalReceipt = await walletClient.waitForTransactionReceipt({
            hash: approvalHash,
            timeout: 60_000,
          });

          if (approvalReceipt.status === "reverted") {
            throw new Error("Approval transaction failed");
          }

          console.log("[Deposit] Approval confirmed");
        } catch (approvalError: any) {
          console.error("[Deposit] Approval failed:", approvalError);
          throw new Error(`Token approval failed: ${approvalError.message}`);
        }
      } else {
        console.log("[Deposit] Sufficient allowance exists, skipping approval");
      }

      // ========================================
      // STEP  3: Check user balance
      // ========================================
      console.log("[Deposit] Checking user balance...");
      const balance = (await publicClient.readContract({
        address: checksumTokenAddress,
        abi: erc20Abi,
        functionName: "balanceOf",
        args: [address as `0x${string}`],
      })) as bigint;

      console.log("[Deposit] User balance:", formatUnits(balance, decimals));

      if (balance < amountInWei) {
        throw new Error(
          `Insufficient balance. Required: ${amount}, Available: ${formatUnits(balance, decimals)}`,
        );
      }

      // ========================================
      // STEP 4: Simulate deposit
      // ========================================
      console.log("[Deposit] Simulating deposit transaction...");
      const walletClient = await getWalletClient();

      await walletClient.simulateContract({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: "depositLocal",
        args: [checksumTokenAddress, amountInWei, checksumRecipient],
        account: address as `0x${string}`,
      });

      console.log("[Deposit] Simulation successful");

      // ========================================
      // STEP 5: Execute deposit
      // ========================================
      setCurrentStep(DepositStep.DEPOSITING);
      console.log("[Deposit] Executing deposit...");

      const txHash = await walletClient.writeContract({
        address: balanceManagerAddress,
        abi: BalanceManagerABI,
        functionName: "depositLocal",
        args: [checksumTokenAddress, amountInWei, checksumRecipient],
      });

      console.log("[Deposit] Transaction submitted:", txHash);
      setHash(txHash);

      // ========================================
      // STEP 6: Wait for confirmation
      // ========================================
      setCurrentStep(DepositStep.CONFIRMING);
      const txReceipt = await walletClient.waitForTransactionReceipt({
        hash: txHash,
        timeout: 60_000,
      });

      if (txReceipt.status === "reverted") {
        throw new Error("Deposit transaction reverted");
      }

      console.log(
        "[Deposit] Transaction confirmed:",
        txReceipt.transactionHash,
      );

      // ========================================
      // STEP 7: Complete
      // ========================================
      setCurrentStep(DepositStep.COMPLETED);
      setIsPending(false);
      setError(null);

      onSuccess?.(txHash);

      return txHash;
    } catch (err: any) {
      console.error("[Deposit] Error:", err);

      const errorMessage = err?.message || "Deposit failed. Please try again.";
      const parsedError = new Error(errorMessage);

      setCurrentStep(DepositStep.ERROR);
      setError(parsedError);
      setIsPending(false);

      onError?.(parsedError);
      throw parsedError;
    }
  };

  return {
    deposit,
    isPending,
    isApproving: currentStep === DepositStep.APPROVING,
    isConfirming: currentStep === DepositStep.CONFIRMING,
    isCompleted: currentStep === DepositStep.COMPLETED,
    error,
    hash,
    currentStep,
  };
}
