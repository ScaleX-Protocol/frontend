/**
 * Centralized Utilities - Barrel Exports
 * Easy imports for all centralized utilities
 */

// Validation utilities
export {
  addressSchema,
  amountSchema,
  tokenAmountSchema,
  isValidAddress,
  isValidAmount,
  validateTokenAmount,
  validateDepositParams,
  validateWithdrawParams,
  validateBorrowParams,
  validateRepayParams,
  createValidator,
  validateAddress,
  validateAmount,
  validateTokenAmountWithSchema,
  type ValidationResult
} from './validation';

// Formatting utilities
export {
  formatTokenAmount,
  formatBalance,
  formatPrice,
  formatTransactionHash,
  formatAddress,
  formatTime,
  formatDuration,
  formatCooldown,
  formatPercent,
  formatHealthFactor,
  formatNumber,
  formatSymbol,
  formatAssetPair
} from './format';

// Web3 utilities
export {
  getExplorerUrl,
  getTransactionUrl,
  getAddressUrl,
  getBlockUrl,
  parseChainId,
  isSupportedChain,
  getChainName,
  ContractError,
  parseContractError,
  estimateGasCost,
  type GasEstimate,
  normalizeAddress,
  checksumAddress,
  createToken,
  type TokenInfo,
  getNetworkName,
  isTestnet,
  isERC20Transfer,
  parseERC20Transfer,
  formatUnits,
  parseUnits
} from './web3';

// Common utilities
export {
  assertNotNull,
  assert,
  chunk,
  unique,
  groupBy,
  sortBy,
  omit,
  pick,
  deepMerge,
  capitalize,
  camelCase,
  kebabCase,
  truncate,
  slugify,
  clamp,
  roundTo,
  percentage,
  changePercentage,
  delay,
  timeout,
  retry,
  SimpleCache,
  debounce,
  throttle,
  buildUrl,
  parseUrl,
  isDevelopment,
  isProduction,
  isTest,
  isBrowser,
  isServer,
  randomInt,
  randomFloat,
  randomChoice,
  randomId
} from './common';

