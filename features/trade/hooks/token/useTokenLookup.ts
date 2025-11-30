import { type UseQueryOptions, useQuery } from '@tanstack/react-query';
import type { Token } from '../../types/token.types';
import { fetchAPI } from '../../../../hooks/fetchAPI';
import type { CurrenciesResponse, Currency } from '../../../faucet/types/faucet.types';

interface UseTokenLookupParams {
  chainId?: number;
  tokenType?: 'underlying' | 'synthetic';
}

export function useTokenLookup(
  params?: UseTokenLookupParams,
  options?: Omit<UseQueryOptions<Token[], Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery<Token[], Error>({
    queryKey: ['currencies', params] as const,
    queryFn: async (): Promise<Token[]> => {
      // Build query string
      const queryParams = new URLSearchParams();
      if (params?.chainId) queryParams.append('chainId', params.chainId.toString());
      if (params?.tokenType) queryParams.append('tokenType', params.tokenType);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/currencies?${queryString}` : '/currencies';

      const response = await fetchAPI<CurrenciesResponse>(endpoint);

      if (!response.success || !response.data?.items) {
        return [];
      }

      // Transform Currency to Token format
      return response.data.items
        .map((currency: Currency): Token => ({
          address: currency.address as `0x${string}`,
          symbol: currency.symbol,
          name: currency.name,
          decimals: currency.decimals,
          isNative: currency.tokenType === 'underlying',
        }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    ...options,
  });
}

export function useTokenLookupUtils() {
  const { data: tokens = [], isLoading, error } = useTokenLookup();

  // Helper function to find token by symbol
  const getTokenBySymbol = (symbol: string): Token | undefined => {
    // Ensure tokens is an array before calling find
    if (!Array.isArray(tokens)) {
      return undefined;
    }
    return tokens.find(token =>
      token.symbol.toLowerCase() === symbol.toLowerCase()
    );
  };

  // Helper function to get market tokens (base and quote)
  const getMarketTokens = (
    baseSymbol: string,
    quoteSymbol: string
  ): { baseToken: Token | undefined; quoteToken: Token | undefined } => {
    const baseToken = getTokenBySymbol(baseSymbol);
    const quoteToken = getTokenBySymbol(quoteSymbol);

    return { baseToken, quoteToken };
  };

  // Helper function to get all token symbols for debugging
  const getAllSymbols = (): string[] => {
    // Ensure tokens is an array before calling map
    if (!Array.isArray(tokens)) {
      return [];
    }
    return tokens.map(token => token.symbol);
  };

  return {
    tokens,
    isLoading,
    error,
    getTokenBySymbol,
    getMarketTokens,
    getAllSymbols,
  };
}