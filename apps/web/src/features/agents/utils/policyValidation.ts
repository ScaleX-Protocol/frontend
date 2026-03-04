import type { PolicyStruct } from "./policyTemplates";

export interface PolicyValidationError {
  field: string;
  message: string;
}

export function validatePolicy(policy: PolicyStruct): PolicyValidationError[] {
  const errors: PolicyValidationError[] = [];

  // Validate order sizes
  if (policy.maxOrderSize === 0n) {
    errors.push({
      field: "maxOrderSize",
      message: "Max order size must be greater than 0",
    });
  }

  if (policy.minOrderSize > policy.maxOrderSize) {
    errors.push({
      field: "minOrderSize",
      message: "Min order size cannot be greater than max order size",
    });
  }

  // Validate health factor
  const minHealthFactorValue = Number(policy.minHealthFactor) / 1e18;
  if (minHealthFactorValue < 1.0) {
    errors.push({
      field: "minHealthFactor",
      message: "Min health factor must be at least 1.0 (100%)",
    });
  }

  // Validate slippage
  const maxSlippageValue = Number(policy.maxSlippageBps);
  if (maxSlippageValue > 10000) {
    errors.push({
      field: "maxSlippageBps",
      message: "Max slippage cannot exceed 100%",
    });
  }

  // Validate drawdown limits
  const maxDailyDrawdownValue = Number(policy.maxDailyDrawdown);
  if (maxDailyDrawdownValue > 10000) {
    errors.push({
      field: "maxDailyDrawdown",
      message: "Max daily drawdown cannot exceed 100%",
    });
  }

  const maxWeeklyDrawdownValue = Number(policy.maxWeeklyDrawdown);
  if (maxWeeklyDrawdownValue > 10000) {
    errors.push({
      field: "maxWeeklyDrawdown",
      message: "Max weekly drawdown cannot exceed 100%",
    });
  }

  // Validate trading hours
  const tradingStartHour = Number(policy.tradingStartHour);
  const tradingEndHour = Number(policy.tradingEndHour);
  if (tradingStartHour < 0 || tradingStartHour > 23) {
    errors.push({
      field: "tradingStartHour",
      message: "Trading start hour must be between 0 and 23",
    });
  }
  if (tradingEndHour < 0 || tradingEndHour > 23) {
    errors.push({
      field: "tradingEndHour",
      message: "Trading end hour must be between 0 and 23",
    });
  }

  // Validate auto-borrow settings
  if (policy.allowAutoBorrow && policy.maxAutoBorrowAmount === 0n) {
    errors.push({
      field: "maxAutoBorrowAmount",
      message: "Max auto-borrow amount must be set when auto-borrow is enabled",
    });
  }

  // Validate auto-repay settings
  if (policy.allowAutoRepay && policy.minDebtToRepay === 0n) {
    errors.push({
      field: "minDebtToRepay",
      message: "Min debt to repay must be set when auto-repay is enabled",
    });
  }

  // Validate token addresses
  const invalidWhitelistedTokens = policy.whitelistedTokens.filter(
    (token) => !/^0x[a-fA-F0-9]{40}$/.test(token)
  );
  if (invalidWhitelistedTokens.length > 0) {
    errors.push({
      field: "whitelistedTokens",
      message: `Invalid token address: ${invalidWhitelistedTokens[0]}`,
    });
  }

  const invalidBlacklistedTokens = policy.blacklistedTokens.filter(
    (token) => !/^0x[a-fA-F0-9]{40}$/.test(token)
  );
  if (invalidBlacklistedTokens.length > 0) {
    errors.push({
      field: "blacklistedTokens",
      message: `Invalid token address: ${invalidBlacklistedTokens[0]}`,
    });
  }

  // Check for conflicting token lists
  const conflictingTokens = policy.whitelistedTokens.filter((token) =>
    policy.blacklistedTokens.includes(token)
  );
  if (conflictingTokens.length > 0) {
    errors.push({
      field: "tokenLists",
      message: `Token ${conflictingTokens[0]} cannot be in both whitelist and blacklist`,
    });
  }

  // Validate emergency recipient
  if (
    policy.emergencyRecipient !==
      "0x0000000000000000000000000000000000000000" &&
    !/^0x[a-fA-F0-9]{40}$/.test(policy.emergencyRecipient)
  ) {
    errors.push({
      field: "emergencyRecipient",
      message: "Invalid emergency recipient address",
    });
  }

  // Validate permissions consistency
  if (policy.allowAutoBorrow && !policy.allowBorrow) {
    errors.push({
      field: "allowAutoBorrow",
      message: "Auto-borrow requires borrow permission to be enabled",
    });
  }

  if (policy.allowAutoRepay && !policy.allowRepay) {
    errors.push({
      field: "allowAutoRepay",
      message: "Auto-repay requires repay permission to be enabled",
    });
  }

  if (!policy.allowBuy && !policy.allowSell) {
    errors.push({
      field: "permissions",
      message: "At least one of Buy or Sell must be enabled",
    });
  }

  if (!policy.allowMarketOrders && !policy.allowLimitOrders) {
    errors.push({
      field: "permissions",
      message: "At least one order type (Market or Limit) must be enabled",
    });
  }

  return errors;
}

export function getPolicyWarnings(policy: PolicyStruct): string[] {
  const warnings: string[] = [];

  // Warning for very high slippage
  const maxSlippagePercent = Number(policy.maxSlippageBps) / 100;
  if (maxSlippagePercent > 10) {
    warnings.push(
      `High slippage tolerance (${maxSlippagePercent}%) may result in unfavorable trades`
    );
  }

  // Warning for low health factor
  const minHealthFactorValue = Number(policy.minHealthFactor) / 1e18;
  if (minHealthFactorValue < 1.2 && policy.allowBorrow) {
    warnings.push(
      `Low health factor (${minHealthFactorValue.toFixed(
        2
      )}) increases liquidation risk`
    );
  }

  // Warning for no volume limits
  if (policy.dailyVolumeLimit === 0n && policy.weeklyVolumeLimit === 0n) {
    warnings.push("No volume limits set - agent can trade unlimited amounts");
  }

  // Warning for no drawdown limits
  if (policy.maxDailyDrawdown === 0n && policy.maxWeeklyDrawdown === 0n) {
    warnings.push("No drawdown limits set - agent can lose unlimited amounts");
  }

  // Warning for 24/7 trading
  if (policy.tradingStartHour === 0n && policy.tradingEndHour === 23n) {
    warnings.push("Agent can trade 24/7 with no time restrictions");
  }

  // Warning for unlimited order size
  const UINT256_MAX = BigInt(
    "115792089237316195423570985008687907853269984665640564039457584007913129639935"
  );
  if (policy.maxOrderSize === UINT256_MAX) {
    warnings.push(
      "No max order size limit - agent can place orders of any size"
    );
  }

  // Warning for no trade frequency limits
  if (policy.maxTradesPerDay === 0n && policy.maxTradesPerHour === 0n) {
    warnings.push("No trade frequency limits - agent can trade continuously");
  }

  // Warning for very short cooldown
  if (policy.minTimeBetweenTrades < 60n) {
    warnings.push(
      `Very short cooldown (${policy.minTimeBetweenTrades}s) may result in excessive trading`
    );
  }

  return warnings;
}
