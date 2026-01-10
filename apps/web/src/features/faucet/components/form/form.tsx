'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar, Clock, ExternalLink, Wallet } from 'lucide-react';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { type UseCurrenciesParams, useCurrencies } from '@/hooks/useCurrencies';
import { useWalletState } from '@scalex/service-wallet';
import { type UseFaucetManagerParams, useFaucetManager } from '../../hooks/useFaucetManager';
import type { FaucetRequest } from '../../types/faucet.types';
import { ChainConfig } from '@/configs/chain';
import type { Currency } from '@/types/currency.types';
import { baseSepolia } from 'viem/chains';

// Helper to get chain name from chainId
const getChainName = (chainId: number): string => {
  if (chainId === baseSepolia.id) return baseSepolia.name;
  return `Chain ${chainId}`;
};

const faucetSchema = z.object({
  tokenAddress: z.string().min(42, 'Please enter a valid token address'),
});

type FaucetFormValues = z.infer<typeof faucetSchema>;

export default function Form() {
  const wallet = useWalletState();

  // Use wallet chainId or fallback to default (Base Sepolia)
  const chainId = wallet.externalWallet.chainId || ChainConfig.defaultChainId;
  const userAddress = wallet.externalWallet.address;

  const faucetManagerParams: UseFaucetManagerParams = {
    chainId: chainId,
    address: userAddress,
  };

  // Use faucet manager for all operations
  const faucetManager = useFaucetManager(faucetManagerParams);

  const currenciesParams: UseCurrenciesParams = {
    chainId: chainId,
    limit: 50,
    onlyActual: true,
  };

  // Fetch available currencies
  const { data: currenciesData, isLoading: currenciesLoading } = useCurrencies(currenciesParams);

  const availableTokens = useMemo<Currency[]>(() => currenciesData?.data?.items || [], [currenciesData?.data?.items]);

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

      if (!result.success) {
        alert(`Request failed: ${result.error}`);
      }
    } catch (error) {
      console.error('Request failed:', error);
      alert(`Request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (!userAddress) {
    return (
      <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
        <div className="flex items-center justify-center py-12">
          <div className="text-red-400">User address not configured</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#242424] rounded-[20px] p-[18px] flex flex-col gap-[18px] border border-[#404040]">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Token Selection */}
        <div className="bg-[#1A1A1A] rounded-md p-4 border border-[#383838]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-[#E0E0E0] font-medium mb-2 font-dm-sans text-sm" htmlFor="tokenAddress">
                Select Token
              </label>
              <select
                {...form.register('tokenAddress')}
                className="w-full text-[#E0E0E0] bg-[#2A2A2A] border border-[#383838] rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#F06718]/40 transition-colors"
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

            <div className="bg-[#3A3A3A] rounded-md p-4 border border-[#383838]">
              <p className="text-[#E0E0E0] text-sm font-dm-sans">
                <span className="font-medium">Fixed Amount:</span> 1000 tokens
              </p>
              <p className="text-[#666666] text-xs mt-1 font-dm-sans">Amount is predefined by the faucet</p>
            </div>

            <button
              type="submit"
              disabled={faucetManager.request.isLoading || !userAddress}
              className="w-full bg-[#F06718] hover:bg-[#D85A14] disabled:bg-[#3A3A3A] disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-md transition-colors"
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
          {/* <div className="bg-[#1A1A1A] rounded-md border border-[#383838] p-4 flex flex-col items-start justify-start">
            <div className="flex flex-row gap-3 items-center mb-3">
              <Clock className="w-5 h-5 text-[#F06718]" />
              <span className="text-[#666666] text-sm font-medium font-dm-sans">CHAIN</span>
            </div>
            <span className="text-[#E0E0E0] text-sm font-medium font-dm-sans">{getChainName(chainId)}</span>
          </div> */}

          <div className="bg-[#1A1A1A] rounded-md border border-[#383838] p-4 flex flex-col items-start justify-start">
            <div className="flex flex-row gap-3 items-center mb-3">
              <Calendar className="w-5 h-5 text-[#F06718]" />
              <span className="text-[#666666] text-sm font-medium font-dm-sans">SELECTED TOKEN</span>
            </div>
            <span className="text-[#E0E0E0] text-sm font-medium font-dm-sans">{selectedToken ? selectedToken.symbol : '-'}</span>
          </div>

          <div className="bg-[#1A1A1A] rounded-md border border-[#383838] p-4 flex flex-col items-start justify-start">
            <div className="flex flex-row gap-3 items-center mb-3">
              <Wallet className="w-5 h-5 text-[#F06718]" />
              <span className="text-[#666666] text-sm font-medium font-dm-sans">USER ADDRESS</span>
            </div>
            <span className="text-[#E0E0E0] text-sm font-mono">
              {userAddress ? `${userAddress.slice(0, 6)}...${userAddress.slice(-4)}` : 'Not Configured'}
            </span>
          </div>
        </div>
      </div>

      {/* Status Messages */}
      {faucetManager.request.isSuccess && faucetManager.request.transactionHash && (
        <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-md">
          <p className="text-green-400 mb-2 font-medium">✅ Tokens sent successfully!</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-green-400/80 font-dm-sans">Transaction:</span>
            <a
              href={`https://base-sepolia.blockscout.com/tx/${faucetManager.request.transactionHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#F06718] hover:text-[#FF8A3D] text-sm flex items-center gap-1 transition-colors"
            >
              {faucetManager.request.transactionHash.slice(0, 10)}...
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-sm text-green-400/80 mt-1 font-dm-sans">
            Amount: {faucetManager.request.amountSent} {faucetManager.request.tokenSymbol}
          </p>
        </div>
      )}

      {faucetManager.request.error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-md">
          <p className="text-red-400">❌ Request failed: {faucetManager.request.error}</p>
        </div>
      )}
    </div>
  );
}
