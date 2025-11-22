'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, ExternalLink, Wallet } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { type UseCurrenciesParams, useCurrencies } from '@/features/faucet/hooks/useCurrencies';
import { useWalletState } from '@/hooks/useWalletState';
import { type UseFaucetManagerParams, useFaucetManager } from '../../hooks/useFaucetManager';
import type { FaucetRequest } from '../../types/faucet.types';
import { Contracts } from '@/configs/contracts';

const faucetSchema = z.object({
  tokenAddress: z.string().min(42, 'Please enter a valid token address'),
});

type FaucetFormValues = z.infer<typeof faucetSchema>;

export default function Form() {
  const wallet = useWalletState();

  const chainId = wallet.externalWallet.chainId;
  const userAddress = wallet.externalWallet.address;

  // Get addresses from environment variables
  const faucetAddress = Contracts[chainId].faucetAddress;

  const faucetManagerParams: UseFaucetManagerParams = {
    chainId: chainId,
    address: userAddress,
  };

  // Use faucet manager for all operations
  const faucetManager = useFaucetManager(faucetManagerParams);

  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    onlyActual: true,
    limit: 50,
  };

  // Fetch available currencies
  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableTokens = useMemo(() => currenciesData?.data?.items || [], [currenciesData?.data?.items]);

  const form = useForm<FaucetFormValues>({
    resolver: zodResolver(faucetSchema),
    defaultValues: {
      tokenAddress: '',
    },
  });

  // Set default token when currencies load
  useEffect(() => {
    if (availableTokens.length > 0 && !form.watch('tokenAddress')) {
      form.setValue('tokenAddress', availableTokens[0].address);
    }
  }, [availableTokens, form]);

  const {
    watch,
    handleSubmit,
    formState: { errors },
  } = form;
  const selectedTokenAddress = watch('tokenAddress');

  const selectedToken = availableTokens.find(
    (token) => token.address.toLowerCase() === selectedTokenAddress?.toLowerCase(),
  );

  const onSubmit = async (values: FaucetFormValues) => {
    if (!userAddress) {
      alert('User address not configured');
      return;
    }

    try {
      const request: FaucetRequest = {
        address: userAddress,
        tokenAddress: values.tokenAddress,
      };

      const result = await faucetManager.requestTokens(request);

      if (result.success) {
        // Refresh history after successful request
        setTimeout(() => {
          faucetManager.refreshAll();
        }, 2000);
      } else {
        alert(`Request failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!faucetAddress || !userAddress) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-red-400">
          {!faucetAddress && 'Faucet address not configured'}
          {!userAddress && 'User address not configured'}
        </div>
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
              <label className="block text-[#E0E0E0]/70 font-medium mb-2" htmlFor="tokenAddress">
                Select Token
              </label>
              <select
                {...form.register('tokenAddress')}
                className="w-full text-[#E0E0E0] bg-[#1A1A1A] border border-[#E0E0E0]/20 rounded-md px-4 py-3 focus:outline-none focus:ring focus:ring-[#F06718]/40"
                disabled={faucetManager.request.isLoading || currenciesLoading}
              >
                {currenciesLoading ? (
                  <option disabled>Loading tokens...</option>
                ) : availableTokens.length === 0 ? (
                  <option disabled>No tokens available</option>
                ) : (
                  availableTokens.map((token) => (
                    <option key={token.address} value={token.address}>
                      {token.symbol} - {token.name}
                    </option>
                  ))
                )}
              </select>
              {errors.tokenAddress && <p className="mt-2 text-sm text-red-400">{errors.tokenAddress.message}</p>}
            </div>

            <div className="bg-[#3A3A3A] rounded-md p-3">
              <p className="text-[#E0E0E0]/70 text-sm">
                <span className="font-medium">Fixed Amount:</span> 1000 tokens
              </p>
              <p className="text-[#E0E0E0]/50 text-xs mt-1">Amount is predefined by the faucet</p>
            </div>

            <button
              type="submit"
              disabled={faucetManager.request.isLoading || !userAddress}
              className="w-full bg-[#F06718] disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {faucetManager.request.isLoading
                ? 'Processing...'
                : !userAddress
                  ? 'Address Not Configured'
                  : 'Request Tokens'}
            </button>
          </form>
        </div>

        {/* Right Side - Info Cards */}
        <div className="flex flex-col gap-4">
          <div className="rounded-sm border border-[#E0E0E0]/20 p-4 flex flex-col items-start justify-start h-fit">
            <div className="flex flex-row gap-3 items-center mb-3">
              <Clock className="w-5 h-5 text-[#F06718]" />
              <span className="text-[#E0E0E0]/70 text-sm font-medium">CHAIN</span>
            </div>
            <span className="text-[#E0E0E0] text-sm font-medium">Chain {chainId}</span>
          </div>

          <div className="rounded-sm border border-[#E0E0E0]/20 p-4 flex flex-col items-start justify-start h-fit">
            <div className="flex flex-row gap-3 items-center mb-3">
              <Calendar className="w-5 h-5 text-[#F06718]" />
              <span className="text-[#E0E0E0]/70 text-sm font-medium">SELECTED TOKEN</span>
            </div>
            <span className="text-[#E0E0E0] text-sm font-medium">{selectedToken ? selectedToken.symbol : '-'}</span>
          </div>

          <div className="rounded-sm border border-[#E0E0E0]/20 p-4 flex flex-col items-start justify-start h-fit">
            <div className="flex flex-row gap-3 items-center mb-3">
              <Wallet className="w-5 h-5 text-[#F06718]" />
              <span className="text-[#E0E0E0]/70 text-sm font-medium">USER ADDRESS</span>
            </div>
            <span className="text-[#E0E0E0] text-sm font-mono">
              {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {faucetManager.request.isSuccess && faucetManager.request.transactionHash && (
        <div className="mt-6 p-4 bg-green-900/30 border border-green-500 rounded-lg">
          <p className="text-green-400 mb-2">✅ Tokens sent successfully!</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-300">Transaction:</span>
            <a
              href={`https://base-sepolia.blockscout.com/tx/${faucetManager.request.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
            >
              {faucetManager.request.transactionHash.slice(0, 10)}...
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-sm text-green-300 mt-1">
            Amount: {faucetManager.request.amountSent} {faucetManager.request.tokenSymbol}
          </p>
        </div>
      )}

      {faucetManager.request.error && (
        <div className="mt-6 p-4 bg-red-900/30 border border-red-500 rounded-lg">
          <p className="text-red-400">❌ Request failed: {faucetManager.request.error}</p>
        </div>
      )}
    </div>
  );
}
