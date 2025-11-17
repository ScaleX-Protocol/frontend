'use client';

import type { HexAddress } from '../../types/faucet.types';
import { useFaucetTokensData } from '../../hooks/useFaucetTokensData';
import { useRequestTokenMutation } from '../../hooks/useRequestTokenMutation';
import { useEffect, useState } from 'react';
import { useUserAndFaucetBalances } from '../../hooks/useUserAndFaucetBalances';
import { useLastRequestTime } from '../../hooks/useLastRequestTime';
import { useFaucetCooldown } from '../../hooks/useFaucetCooldown';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Clock, Wallet } from 'lucide-react';
import { formatBalance, formatCooldown } from '../../utils/faucet.helper';

const faucetSchema = z.object({
  token: z.string().min(1, 'Please select a token'),
});

type FaucetFormValues = z.infer<typeof faucetSchema>;

export default function Form() {
  const userAddress = '0xabcdef1234567890123456789012345678901234' as HexAddress;
  const faucetAddress = '0x9876543210987654321098765432109876543210' as HexAddress;
  const chainId = 1;

  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const form = useForm<FaucetFormValues>({
    resolver: zodResolver(faucetSchema as any),
    defaultValues: {
      token: '',
    },
  });

  const { watch, setValue, handleSubmit } = form;
  const selectedTokenAddress = watch('token');

  const { faucetTokensData, loading: tokensLoading, error: tokensError } = useFaucetTokensData(chainId);

  const {
    userBalance,
    faucetBalance,
    loading: balancesLoading,
    refetch: refetchBalances,
  } = useUserAndFaucetBalances(userAddress, faucetAddress, selectedTokenAddress as HexAddress);

  const {
    lastRequestTime,
    loading: lastRequestLoading,
    refetch: refetchLastRequestTime,
  } = useLastRequestTime(userAddress, faucetAddress);

  const { faucetCooldown, loading: cooldownLoading } = useFaucetCooldown(faucetAddress);

  const requestTokenMutation = useRequestTokenMutation();

  const tokenOptions =
    faucetTokensData?.faucetTokenss.items
      .filter((token) => token.isActive)
      .map((token) => ({
        token: token.token,
        symbol: token.symbol,
        decimals: token.decimals,
        name: token.name,
      })) || [];

  const selectedToken = tokenOptions.find((token) => token.token === selectedTokenAddress);

  const cooldownRemaining =
    lastRequestTime && faucetCooldown
      ? Math.max(0, faucetCooldown - (Math.floor(Date.now() / 1000) - lastRequestTime))
      : 0;

  const canRequest = cooldownRemaining === 0;

  useEffect(() => {
    if (tokenOptions.length > 0 && !selectedTokenAddress) {
      setValue('token', tokenOptions[0].token);
    }
  }, [tokenOptions, selectedTokenAddress, setValue]);

  // Handle mutation status updates
  useEffect(() => {
    if (requestTokenMutation.isPending) {
      setTxStatus('Preparing transaction...');
      setTxHash(null);
    } else if (requestTokenMutation.isSuccess) {
      setTxStatus('Transaction completed successfully!');
      setTxHash(requestTokenMutation.data.txHash);

      // Refetch data after successful request
      refetchBalances();
      refetchLastRequestTime();
    } else if (requestTokenMutation.isError) {
      setTxStatus(`Transaction failed: ${requestTokenMutation.error.message}`);
      setTxHash(null);
    }
  }, [
    requestTokenMutation.isPending,
    requestTokenMutation.isSuccess,
    requestTokenMutation.isError,
    requestTokenMutation.data,
    requestTokenMutation.error,
    refetchBalances,
    refetchLastRequestTime,
  ]);

  const onSubmit = async (values: FaucetFormValues) => {
    if (!canRequest) {
      setTxStatus(`Please wait ${cooldownRemaining} seconds before next request`);
      return;
    }

    try {
      await requestTokenMutation.mutateAsync({
        userAddress,
        tokenAddress: values.token as HexAddress,
      });
    } catch (error) {
      // Error is handled in the effect above
      console.error('Request failed:', error);
    }
  };

  if (tokensLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-white">Loading faucet data...</div>
      </div>
    );
  }

  if (tokensError) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-red-400">Error loading faucet data</div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#2C2C2C] rounded-md p-2">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Token Selection */}
        <div className="rounded-sm p-2 border border-[#E0E0E0]/20">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-[#E0E0E0]/70 font-medium mb-2" htmlFor="token">
                Select Token
              </label>
              <select
                {...form.register('token')}
                className="w-full text-[#E0E0E0] border border-[#E0E0E0]/20 rounded-md px-4 py-3 focus:outline-none focus:ring focus:ring-[#E0E0E0]/40"
                disabled={requestTokenMutation.isPending}
              >
                <option value="">Choose a token</option>
                {tokenOptions.map((token) => (
                  <option key={token.token} value={token.token}>
                    {token.symbol} - {token.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.token && (
                <p className="mt-2 text-sm text-red-400">{form.formState.errors.token.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={requestTokenMutation.isPending || balancesLoading}
              className="w-full bg-[#F06718] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {requestTokenMutation.isPending
                ? 'Processing...'
                : canRequest
                  ? `Wait ${formatCooldown(cooldownRemaining)}`
                  : 'Request Tokens'}
            </button>
          </form>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-sm border border-[#E0E0E0]/20 p-2 flex flex-col items-start justify-start h-fit">
            <div className="flex flex-row gap-2 items-center mb-2">
              <Wallet className="w-5 h-5 text-[#F06718]/70" />
              <span className="text-[#E0E0E0]/70 text-sm font-medium">FAUCET BALANCE</span>
            </div>
            <span className="text-[#E0E0E0] text-lg font-medium">
              {selectedToken && !balancesLoading
                ? `${formatBalance(faucetBalance, selectedToken.decimals)} ${selectedToken.symbol}`
                : '-'}
            </span>
          </div>

          <div className="rounded-sm border border-[#E0E0E0]/20 p-2 flex flex-col items-start justify-start h-fit">
            <div className="flex flex-row gap-2 items-center mb-2">
              <Clock className="w-5 h-5 text-[#F06718]/70" />
              <span className="text-[#E0E0E0]/70 text-sm font-medium">COOLDOWN</span>
            </div>
            <span className="text-[#E0E0E0] text-lg font-medium">
              {cooldownLoading ? '-' : formatCooldown(cooldownRemaining)}
            </span>
          </div>

          <div className="rounded-sm border border-[#E0E0E0]/20 p-2 flex flex-col items-start justify-start h-fit">
            <div className="flex flex-row gap-2 items-center mb-2">
              <Calendar className="w-5 h-5 text-[#F06718]/70" />
              <span className="text-[#E0E0E0]/70 text-sm font-medium">LAST REQUEST</span>
            </div>
            <span className="text-[#E0E0E0] text-lg font-medium">
              {lastRequestLoading ? '-' : lastRequestTime ? new Date(lastRequestTime * 1000).toLocaleDateString() : '-'}
            </span>
          </div>

          <div className="rounded-sm border border-[#E0E0E0]/20 p-2 flex flex-col items-start justify-start h-fit">
            <div className="flex flex-row gap-2 items-center mb-2">
              <Wallet className="w-5 h-5 text-[#F06718]/70" />
              <span className="text-[#E0E0E0]/70 text-sm font-medium">YOUR BALANCE</span>
            </div>
            <span className="text-[#E0E0E0] text-lg font-medium">
              {selectedToken && !balancesLoading
                ? `${formatBalance(userBalance, selectedToken.decimals)} ${selectedToken.symbol}`
                : '-'}
            </span>
          </div>
        </div>
      </div>
      {/* {txStatus && (
        <div
          className={`mt-8 p-4 rounded-lg ${
            requestTokenMutation.isError
              ? 'bg-red-900/30 border border-red-500'
              : requestTokenMutation.isSuccess
                ? 'bg-green-900/30 border border-green-500'
                : 'bg-gray-800'
          }`}
        >
          <p className="text-white mb-2">{txStatus}</p>
          {txHash && (
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm"
            >
              View transaction →
            </a>
          )}
        </div>
      )} */}
    </div>
  );
}
