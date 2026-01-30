/**
 * Utility functions for interacting with the indexer
 */

const INDEXER_STATUS_URL = 'https://base-sepolia-indexer.scalex.money/status';
const MAX_POLLING_ATTEMPTS = 60; // 60 attempts
const POLLING_INTERVAL = 2000; // 2 seconds

interface IndexerStatus {
  coreDevnet: {
    block: {
      number: number;
      timestamp: number;
    };
    ready: boolean;
  };
}

/**
 * Fetches the current indexer status
 */
async function fetchIndexerStatus(): Promise<IndexerStatus> {
  const response = await fetch(INDEXER_STATUS_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch indexer status: ${response.statusText}`);
  }
  return response.json();
}

/**
 * Polls the indexer until it has processed the specified block number
 * @param targetBlockNumber - The block number to wait for
 * @param onProgress - Optional callback to report polling progress
 * @returns Promise that resolves when the block is indexed
 */
export async function waitForIndexerSync(
  targetBlockNumber: bigint,
  onProgress?: (currentBlock: number, targetBlock: number, attempt: number) => void
): Promise<void> {
  const targetBlock = Number(targetBlockNumber);

  for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
    try {
      const status = await fetchIndexerStatus();
      const currentBlock = status.coreDevnet.block.number;

      // Report progress
      onProgress?.(currentBlock, targetBlock, attempt);

      // Check if indexer has caught up
      if (currentBlock >= targetBlock) {
        console.log(`✓ Indexer synced to block ${currentBlock} (target: ${targetBlock})`);
        return;
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    } catch (error) {
      console.error(`Indexer polling attempt ${attempt} failed:`, error);

      // If we've exhausted attempts, throw error
      if (attempt === MAX_POLLING_ATTEMPTS) {
        throw new Error(`Indexer sync timeout: failed to reach block ${targetBlock} after ${MAX_POLLING_ATTEMPTS} attempts`);
      }

      // Otherwise continue polling
      await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
    }
  }

  throw new Error(`Indexer sync timeout: exceeded ${MAX_POLLING_ATTEMPTS} polling attempts`);
}

/**
 * Gets the current indexer block number
 */
export async function getIndexerBlockNumber(): Promise<number> {
  const status = await fetchIndexerStatus();
  return status.coreDevnet.block.number;
}
