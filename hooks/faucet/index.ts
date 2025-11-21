// Main faucet hook with all functionality
export { useFaucet } from './useFaucet';
export type {
  FaucetRequest,
  FaucetResponse,
  FaucetHistoryItem,
  FaucetAddressResponse,
} from './useFaucet';

// Specialized hooks for specific use cases
export { useFaucetRequest } from './useFaucetRequest';
export type { UseFaucetRequestState } from './useFaucetRequest';

export { useFaucetHistory } from './useFaucetHistory';
export type { 
  UseFaucetHistoryOptions,
  FaucetHistoryResponse
} from './useFaucetHistory';

export { useFaucetAddress } from './useFaucetAddress';
export type { 
  UseFaucetAddressOptions, 
  UseFaucetAddressState 
} from './useFaucetAddress';

// Comprehensive manager hook
export { useFaucetManager } from './useFaucetManager';
export type { UseFaucetManagerOptions } from './useFaucetManager';