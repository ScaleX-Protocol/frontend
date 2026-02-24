import { useQuery } from '@tanstack/react-query';
import { fetchAgentAPI } from '@/hooks/fetchAgentAPI';
import type { LeaderboardResponse, LeaderboardType, LeaderboardSortBy, LeaderboardWindow } from '../types/leaderboard.types';

interface UseLeaderboardParams {
    type?: LeaderboardType;
    sortBy: LeaderboardSortBy;
    window: LeaderboardWindow;
    chainId?: number;
    limit?: number;
    offset?: number;
}

export function useLeaderboard(params: UseLeaderboardParams) {
    const { type, sortBy, window, chainId = 84532, limit = 10, offset = 0 } = params;

    const search = new URLSearchParams({
        sortBy,
        window,
        chainId: String(chainId),
        limit: String(limit),
        offset: String(offset),
    });
    if (type) search.set('type', type);

    return useQuery<LeaderboardResponse, Error>({
        queryKey: ['leaderboard', type, sortBy, window, chainId, limit, offset],
        queryFn: () => fetchAgentAPI<LeaderboardResponse>(`/leaderboard?${search}`),
        staleTime: 30_000,
    });
}
