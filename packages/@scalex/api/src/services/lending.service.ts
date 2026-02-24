import type { IndexerClient } from '../client/indexer-client';
import type { LendingDashboard } from '@scalex/types';

export const getLendingDashboard = (client: IndexerClient, user: string, chainId?: number) => {
  const query = chainId ? `?chainId=${chainId}` : '';
  return client.fetch<LendingDashboard>(`/lending/dashboard/${user}${query}`);
};