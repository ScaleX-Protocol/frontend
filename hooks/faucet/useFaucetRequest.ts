import { useState, useCallback } from 'react';
import { useFaucet, FaucetRequest, FaucetResponse } from './useFaucet';

export interface UseFaucetRequestState {
  isLoading: boolean;
  error: string | null;
  response: FaucetResponse | null;
  lastRequest: FaucetRequest | null;
}

export function useFaucetRequest(chainId: number = 84532) {
  const { requestTokens } = useFaucet();
  const [state, setState] = useState<UseFaucetRequestState>({
    isLoading: false,
    error: null,
    response: null,
    lastRequest: null,
  });

  const request = useCallback(async (requestData: FaucetRequest) => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastRequest: requestData,
    }));

    try {
      const response = await requestTokens(requestData, chainId);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        response,
        error: response.success ? null : response.error || 'Request failed',
      }));

      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
        response: {
          success: false,
          error: errorMessage,
        },
      }));

      return {
        success: false,
        error: errorMessage,
      } as FaucetResponse;
    }
  }, [requestTokens, chainId]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      response: null,
      lastRequest: null,
    });
  }, []);

  return {
    ...state,
    request,
    reset,
    isSuccess: state.response?.success === true,
    transactionHash: state.response?.transactionHash,
    amountSent: state.response?.amountSent,
    tokenSymbol: state.response?.tokenSymbol,
  };
}