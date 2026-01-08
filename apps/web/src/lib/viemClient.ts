import { ChainConfig, getViemChain } from '@/configs/chain';
import { logger } from '@/utils/prodLogger';
import {
  createWalletClient,
  custom,
  Hash,
  publicActions,
} from 'viem';
import type { Chain } from 'viem';

const log = logger.withContext({ module: 'viemClient' });

// Helper function to safely serialize objects with BigInt values
const serializeSafe = (obj: any): any => {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'bigint') return obj.toString();
  if (Array.isArray(obj)) return obj.map(serializeSafe);
  if (typeof obj === 'object') {
    const result: any = {};
    for (const key in obj) {
      try {
        result[key] = serializeSafe(obj[key]);
      } catch (e) {
        result[key] = String(obj[key]);
      }
    }
    return result;
  }
  return obj;
};

// Re-export getViemChain for backward compatibility
export { getViemChain };


/**
 * Creates a Viem wallet client with automatic request/response interceptors
 * for logging all smart contract interactions
 */
export function createInterceptedWalletClient(
  provider: any,
  account: `0x${string}`,
  chainId: number = ChainConfig.defaultChainId
) {
  const chainConfig = getViemChain(chainId);

  // Create the base wallet client
  const baseClient = createWalletClient({
    account,
    chain: chainConfig,
    transport: custom(provider),
  }).extend(publicActions);

  // Interceptor for writeContract
  const originalWriteContract = baseClient.writeContract.bind(baseClient);
  const interceptedWriteContract = async (args: any) => {
    const startTime = Date.now();
    const requestId = `${args.functionName}-${startTime}`;

    // Log request (safely serialize BigInt values)
    log.info('Smart Contract Write Request', {
      requestId,
      address: args.address,
      functionName: args.functionName,
      args: serializeSafe(args.args),
      chain: chainConfig.name,
      account,
    });

    try {
      const result = await originalWriteContract(args);
      const duration = Date.now() - startTime;

      // Log successful response
      log.info('Smart Contract Write Response', {
        requestId,
        address: args.address,
        functionName: args.functionName,
        txHash: result,
        duration: `${duration}ms`,
        status: 'success',
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Use console.error for full error (avoids BigInt serialization issues)
      console.error('[viemClient] Smart Contract Write Error:', error);

      // Log safe string-only data to the logger
      log.error('Smart Contract Write Error', {
        requestId,
        address: args.address,
        functionName: args.functionName,
        args: serializeSafe(args.args),
        errorName: error?.name || 'Unknown',
        errorMessage: error?.message ? String(error.message) : 'Unknown error',
        duration: `${duration}ms`,
        status: 'error',
      });

      throw error;
    }
  };

  // Interceptor for simulateContract
  const originalSimulateContract = baseClient.simulateContract.bind(baseClient);
  const interceptedSimulateContract = async (args: any) => {
    const startTime = Date.now();
    const requestId = `sim-${args.functionName}-${startTime}`;

    // Log request (safely serialize BigInt values)
    log.info('Smart Contract Simulate Request', {
      requestId,
      address: args.address,
      functionName: args.functionName,
      args: serializeSafe(args.args),
      chain: chainConfig.name,
      account: args.account || account,
    });

    try {
      const result = await originalSimulateContract(args);
      const duration = Date.now() - startTime;

      // Log successful response (safely serialize BigInt values)
      log.info('Smart Contract Simulate Response', {
        requestId,
        address: args.address,
        functionName: args.functionName,
        result: serializeSafe(result.result),
        duration: `${duration}ms`,
        status: 'success',
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Use console.error for full error (avoids BigInt serialization issues)
      console.error('[viemClient] Smart Contract Simulate Error:', error);

      // Log safe string-only data to the logger
      log.error('Smart Contract Simulate Error', {
        requestId,
        address: args.address,
        functionName: args.functionName,
        args: serializeSafe(args.args),
        errorName: error?.name || 'Unknown',
        errorMessage: error?.message ? String(error.message) : 'Unknown error',
        duration: `${duration}ms`,
        status: 'error',
      });

      throw error;
    }
  };

  // Interceptor for readContract
  const originalReadContract = baseClient.readContract.bind(baseClient);
  const interceptedReadContract = async (args: any) => {
    const startTime = Date.now();
    const requestId = `read-${args.functionName}-${startTime}`;

    // Log request (safely serialize BigInt values)
    log.info('Smart Contract Read Request', {
      requestId,
      address: args.address,
      functionName: args.functionName,
      args: serializeSafe(args.args),
      chain: chainConfig.name,
    });

    try {
      const result = await originalReadContract(args);
      const duration = Date.now() - startTime;

      // Log successful response (with truncated result for large data)
      const resultString = String(result);
      const truncatedResult = resultString.length > 200
        ? `${resultString.substring(0, 200)}... (truncated)`
        : resultString;

      log.info('Smart Contract Read Response', {
        requestId,
        address: args.address,
        functionName: args.functionName,
        result: truncatedResult,
        duration: `${duration}ms`,
        status: 'success',
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;

      // Use console.error for full error (avoids BigInt serialization issues)
      console.error('[viemClient] Smart Contract Read Error:', error);

      // Log safe string-only data to the logger
      log.error('Smart Contract Read Error', {
        requestId,
        address: args.address,
        functionName: args.functionName,
        args: serializeSafe(args.args),
        errorName: error?.name || 'Unknown',
        errorMessage: error?.message ? String(error.message) : 'Unknown error',
        duration: `${duration}ms`,
        status: 'error',
      });

      throw error;
    }
  };

  // Return client with intercepted methods
  return {
    ...baseClient,
    writeContract: interceptedWriteContract,
    simulateContract: interceptedSimulateContract,
    readContract: interceptedReadContract,
  };
}

/**
 * Helper function to wait for transaction receipt with logging
 */
export async function waitForTransactionWithLogging(
  client: ReturnType<typeof createInterceptedWalletClient>,
  hash: Hash,
  timeout: number = 60_000
) {
  const startTime = Date.now();

  log.info('Waiting for transaction receipt', {
    txHash: hash,
    timeout: `${timeout}ms`,
  });

  try {
    const receipt = await client.waitForTransactionReceipt({
      hash,
      timeout,
    });

    const duration = Date.now() - startTime;

    log.info('Transaction receipt received', {
      txHash: hash,
      blockNumber: receipt.blockNumber.toString(),
      gasUsed: receipt.gasUsed.toString(),
      status: receipt.status,
      duration: `${duration}ms`,
    });

    return receipt;
  } catch (error: any) {
    const duration = Date.now() - startTime;

    // Use console.error for full error (avoids BigInt serialization issues)
    console.error('[viemClient] Transaction receipt error:', error);

    // Log safe string-only data to the logger
    log.error('Transaction receipt error', {
      txHash: hash,
      errorMessage: error?.message ? String(error.message) : 'Unknown error',
      duration: `${duration}ms`,
    });

    throw error;
  }
}

/**
 * Helper to get transaction details with logging
 */
export async function getTransactionWithLogging(
  client: ReturnType<typeof createInterceptedWalletClient>,
  hash: Hash
) {
  log.info('Fetching transaction details', {
    txHash: hash,
  });

  try {
    const tx = await client.getTransaction({ hash });

    log.info('Transaction details retrieved', {
      txHash: hash,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      gasPrice: tx.gasPrice?.toString(),
    });

    return tx;
  } catch (error: any) {
    // Use console.error for full error (avoids BigInt serialization issues)
    console.error('[viemClient] Failed to fetch transaction details:', error);

    // Log safe string-only data to the logger
    log.error('Failed to fetch transaction details', {
      txHash: hash,
      errorMessage: error?.message ? String(error.message) : 'Unknown error',
    });

    throw error;
  }
}
