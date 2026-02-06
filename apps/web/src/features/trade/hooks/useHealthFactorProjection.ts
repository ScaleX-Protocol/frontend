import { useMemo } from 'react';
import { useChainId } from 'wagmi';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useLendingDashboard } from '@/features/lending/hooks/useLendingDashboard';

export interface UseHealthFactorProjectionParams {
  enabled: boolean;              // Only when auto-borrow is checked
  tokenAddress?: `0x${string}`;  // Token being borrowed
  borrowAmount: string;          // Amount to borrow (as string)
  tokenDecimals?: number;        // Decimals for the token
}

export type HealthStatus = 'safe' | 'warning' | 'danger';

export interface HealthFactorProjection {
  current: number;               // Current HF
  projected: number;             // Projected HF after borrow
  status: HealthStatus;
  isLoading: boolean;
  error: Error | null;
  maxSafeBorrowAmount: string;   // Max to maintain HF ≥ 1.5
}

const MIN_SAFE_HEALTH_FACTOR = 1.5;
const WARNING_HEALTH_FACTOR = 2.0;

// Determine health status based on projected HF
function getHealthStatus(projectedHF: number): HealthStatus {
  if (projectedHF >= WARNING_HEALTH_FACTOR) return 'safe';
  if (projectedHF >= MIN_SAFE_HEALTH_FACTOR) return 'warning';
  return 'danger';
}

export function useHealthFactorProjection({
  enabled,
  tokenAddress,
  borrowAmount,
  tokenDecimals = 18,
}: UseHealthFactorProjectionParams): HealthFactorProjection {
  const chainId = useChainId();

  // Get user address from Privy (same as usePrivyPlaceOrder)
  const { user, authenticated } = usePrivy();
  const { wallets } = useWallets();
  const embeddedWallet = wallets.find((wallet) => 'walletClientType' in wallet && wallet.walletClientType === 'privy');
  const userAddress = embeddedWallet?.address || user?.wallet?.address;

  // Fetch lending dashboard data
  const { data: lendingData, isLoading: isLoadingLending, error: lendingError } = useLendingDashboard(
    { user: userAddress || '', chainId },
    { enabled: enabled && !!userAddress }
  );

  // Debug: Log when lending data changes
  console.log('[HF] Lending data:', {
    enabled,
    authenticated,
    hasData: !!lendingData,
    isLoading: isLoadingLending,
    error: lendingError?.message,
    userAddress,
    walletCount: wallets.length,
    embeddedWallet: !!embeddedWallet,
    summary: lendingData?.summary,
    borrowAmount,
    tokenAddress
  });

  // Parse current health factor
  const current = useMemo(() => {
    if (!enabled || !lendingData) return 0;
    const hf = parseFloat(lendingData.summary.healthFactor);
    // If health factor is very large (>1000), treat as Infinity (no debt)
    return hf > 1000 ? Infinity : hf;
  }, [lendingData, enabled]);

  // Get minimum liquidation threshold from user's collateral
  const minLiquidationThreshold = useMemo(() => {
    if (!enabled || !lendingData) return 0;

    // Find the minimum liquidation threshold across all supplied assets
    let minThreshold = 10000; // Start with 100% (10000 basis points)

    for (const supply of lendingData.supplies) {
      const assetConfig = lendingData.assetConfigurations.find(
        (config) => config.tokenAddress.toLowerCase() === supply.assetAddress.toLowerCase()
      );
      if (assetConfig) {
        const threshold = parseFloat(assetConfig.liquidationThreshold) * 10000; // Convert to basis points
        minThreshold = Math.min(minThreshold, threshold);
      }
    }

    return minThreshold;
  }, [lendingData, enabled]);

  // Get token price and borrow value in USD
  const borrowValueUSD = useMemo(() => {
    if (!enabled || !lendingData || !borrowAmount || !tokenAddress) {
      console.log('[HF] borrowValueUSD = 0: enabled=', enabled, 'hasData=', !!lendingData, 'borrowAmount=', borrowAmount, 'token=', tokenAddress);
      return 0;
    }

    const amount = parseFloat(borrowAmount);
    if (isNaN(amount) || amount <= 0) {
      console.log('[HF] borrowValueUSD = 0: invalid amount=', amount);
      return 0;
    }

    // Try to find token price from existing supplies (most accurate)
    const supplyInfo = lendingData.supplies.find(
      (s) => s.assetAddress.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (supplyInfo) {
      const suppliedAmount = parseFloat(supplyInfo.suppliedAmount);
      const currentValue = parseFloat(supplyInfo.currentValue);
      if (suppliedAmount > 0 && currentValue > 0) {
        const tokenPrice = currentValue / suppliedAmount;
        const valueUSD = amount * tokenPrice;
        console.log('[HF] borrowValueUSD (from supply) =', valueUSD, '| amount=', amount, 'price=', tokenPrice);
        return valueUSD;
      }
    }

    // Try to find token price from existing borrows
    const borrowInfo = lendingData.borrows.find(
      (b) => b.assetAddress.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (borrowInfo) {
      const borrowedAmount = parseFloat(borrowInfo.borrowedAmount);
      const currentDebt = parseFloat(borrowInfo.currentDebt);
      if (borrowedAmount > 0 && currentDebt > 0) {
        const tokenPrice = currentDebt / borrowedAmount;
        const valueUSD = amount * tokenPrice;
        console.log('[HF] borrowValueUSD (from borrow) =', valueUSD, '| amount=', amount, 'price=', tokenPrice);
        return valueUSD;
      }
    }

    // Fallback: Use summary values to estimate (assume equal weighting)
    // This is a rough estimate and may not be accurate
    const totalSupplied = parseFloat(lendingData.summary.totalSupplied);
    const totalBorrowed = parseFloat(lendingData.summary.totalBorrowed);

    // If we can't determine price, conservatively assume 1:1 USD
    console.warn('[HF] Could not determine token price for', tokenAddress, '- using 1:1 USD estimate');
    const valueUSD = amount;
    console.log('[HF] borrowValueUSD (fallback 1:1) =', valueUSD, 'from amount=', amount);
    return valueUSD;
  }, [lendingData, borrowAmount, tokenAddress, enabled]);

  // Calculate projected health factor (matching contract formula)
  const projected = useMemo(() => {
    if (!enabled || !lendingData) return 0;

    const totalCollateralValue = parseFloat(lendingData.summary.totalSupplied);
    const totalDebtValue = parseFloat(lendingData.summary.totalBorrowed);

    // If no collateral supplied, can't borrow
    if (totalCollateralValue === 0) return 0;

    // Calculate weighted collateral value
    // weightedCollateralValue = (totalCollateralValue × minLiquidationThreshold) / 10000
    const BASIS_POINTS = 10000;
    const weightedCollateralValue = (totalCollateralValue * minLiquidationThreshold) / BASIS_POINTS;

    // Add additional borrow to debt
    const newTotalDebt = totalDebtValue + borrowValueUSD;

    console.log('[HF] Projected HF calc:', {
      totalCollateral: totalCollateralValue,
      totalDebt: totalDebtValue,
      borrowValueUSD,
      newTotalDebt,
      weightedCollateral: weightedCollateralValue,
      minLT: minLiquidationThreshold
    });

    // If no debt, health factor is infinite
    if (newTotalDebt === 0) {
      console.log('[HF] Projected HF = ∞ (no debt)');
      return Infinity;
    }

    // HF = weightedCollateralValue / newTotalDebt
    // (PRECISION of 1e18 is already factored in the dashboard values)
    const projectedHF = weightedCollateralValue / newTotalDebt;
    console.log('[HF] Projected HF =', projectedHF);
    return projectedHF;
  }, [lendingData, borrowValueUSD, minLiquidationThreshold, enabled]);

  // Calculate max safe borrow amount (matching contract formula)
  const maxSafeBorrowAmount = useMemo(() => {
    if (!enabled || !lendingData || !tokenAddress) {
      console.log('[HF] maxSafeBorrow = 0: enabled =', enabled, ', hasData =', !!lendingData, ', token =', tokenAddress);
      return '0';
    }

    const totalCollateralValue = parseFloat(lendingData.summary.totalSupplied);
    const totalDebtValue = parseFloat(lendingData.summary.totalBorrowed);

    console.log('[HF] Collateral:', totalCollateralValue, 'Debt:', totalDebtValue, 'MinLT:', minLiquidationThreshold);

    // If no collateral, can't borrow
    if (totalCollateralValue === 0) {
      console.log('[HF] No collateral - maxSafeBorrow = 0');
      return '0';
    }

    // Calculate weighted collateral value
    const BASIS_POINTS = 10000;
    const weightedCollateralValue = (totalCollateralValue * minLiquidationThreshold) / BASIS_POINTS;

    // Calculate max total debt to maintain HF >= 1.5
    // HF = weightedCollateralValue / debt
    // So: debt = weightedCollateralValue / HF
    const maxTotalDebt = weightedCollateralValue / MIN_SAFE_HEALTH_FACTOR;

    // Max additional borrow = max total debt - current debt
    const maxAdditionalBorrow = Math.max(0, maxTotalDebt - totalDebtValue);

    // Add 5% safety margin
    const safeMaxBorrowUSD = maxAdditionalBorrow * 0.95;

    console.log('[HF] Weighted collateral:', weightedCollateralValue, 'Max total debt:', maxTotalDebt, 'Max safe borrow (USD):', safeMaxBorrowUSD);

    // Convert USD to token amount
    // Try to get token price from existing supplies (most accurate)
    let tokenPrice = 1; // Default fallback

    const supplyInfo = lendingData.supplies.find(
      (s) => s.assetAddress.toLowerCase() === tokenAddress.toLowerCase()
    );

    if (supplyInfo) {
      const suppliedAmount = parseFloat(supplyInfo.suppliedAmount);
      const currentValue = parseFloat(supplyInfo.currentValue.replace(/[$,]/g, ''));
      if (suppliedAmount > 0 && currentValue > 0) {
        tokenPrice = currentValue / suppliedAmount;
        console.log('[HF] Token price from supply:', tokenPrice);
      }
    }

    // Try to get token price from existing borrows if not found in supplies
    if (tokenPrice === 1) {
      const borrowInfo = lendingData.borrows.find(
        (b) => b.assetAddress.toLowerCase() === tokenAddress.toLowerCase()
      );

      if (borrowInfo) {
        const borrowedAmount = parseFloat(borrowInfo.borrowedAmount);
        const currentDebt = parseFloat(borrowInfo.currentDebt.replace(/[$,]/g, ''));
        if (borrowedAmount > 0 && currentDebt > 0) {
          tokenPrice = currentDebt / borrowedAmount;
          console.log('[HF] Token price from borrow:', tokenPrice);
        }
      }
    }

    // Convert USD value to token amount
    const safeMaxBorrowTokens = safeMaxBorrowUSD / tokenPrice;

    console.log('[HF] Max safe borrow:', safeMaxBorrowTokens, 'tokens at price:', tokenPrice);

    return safeMaxBorrowTokens.toFixed(tokenDecimals);
  }, [lendingData, tokenAddress, tokenDecimals, minLiquidationThreshold, enabled]);

  // Determine status
  const status = useMemo(() => {
    // Don't show danger/warning if not actually borrowing
    if (borrowValueUSD === 0) return 'safe';
    return getHealthStatus(projected);
  }, [projected, borrowValueUSD]);

  const error = lendingError as Error | null;
  const isLoading = isLoadingLending;

  return {
    current,
    projected,
    status,
    isLoading,
    error,
    maxSafeBorrowAmount,
  };
}
