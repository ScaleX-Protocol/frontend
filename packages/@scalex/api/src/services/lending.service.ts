import type { APIClient } from '../client/api-client';
import type { LendingDashboard } from '@scalex/types';

export const getLendingDashboard = (client: APIClient, user: string, chainId?: number) => {
  const query = chainId ? `?chainId=${chainId}` : '';
  return client.fetch<LendingDashboard>(`/lending/dashboard/${user}${query}`);
};