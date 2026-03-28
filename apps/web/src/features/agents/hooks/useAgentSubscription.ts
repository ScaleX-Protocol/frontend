import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createWalletClient, custom } from 'viem';
import { baseSepolia } from 'viem/chains';
import { Endpoints } from '../../../configs/endpoints';

// USDC contract on Base Sepolia (EIP-3009 compliant)
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;

export interface SubscriptionTier {
  id: string;
  name: string;
  price: string;
  duration_days: number;
  chat_limit: number;
  features: string[];
  description?: string;
}

export interface ActiveSubscription {
  id: number;
  tier: { id: string; name: string; price: string } | SubscriptionTier;
  started_at: string;
  expires_at: string;
  chat_limit: number;
  chats_used: number;
  chats_remaining: number;
  status: string;
}

interface SubscriptionStatusResponse {
  subscribed: boolean;
  wallet: string;
  subscription: ActiveSubscription | null;
  tiers: SubscriptionTier[];
}

function resolveBaseUrl(agentTokenId: string, serviceUrl: string | undefined): string {
  const override = import.meta.env.VITE_AGENT_SERVICE_URL_OVERRIDE;
  return override
    ? `${override}/${agentTokenId}`
    : serviceUrl || `${Endpoints.agent}/${agentTokenId}`;
}

export function useAgentSubscription(
  agentTokenId: string,
  serviceUrl: string | undefined,
  walletAddress: string | undefined,
) {
  const queryClient = useQueryClient();
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [subscribeError, setSubscribeError] = useState<string | null>(null);

  const baseUrl = resolveBaseUrl(agentTokenId, serviceUrl);

  const { data, isLoading } = useQuery<SubscriptionStatusResponse | null>({
    queryKey: ['agentSubscription', agentTokenId, walletAddress],
    queryFn: async () => {
      if (!walletAddress) return null;
      try {
        const res = await fetch(`${baseUrl}/subscription/status?wallet=${walletAddress}`);
        if (!res.ok) return null; // endpoint doesn't exist → no subscription required
        return res.json();
      } catch {
        return null; // network error → treat as no subscription required
      }
    },
    enabled: !!walletAddress,
    staleTime: 30_000,
    retry: 0, // don't retry — a 404 means no subscription endpoint
  });

  const subscribe = useCallback(async (tierId: string, payerAddress: string, getProvider: () => Promise<any>) => {
    if (!payerAddress) throw new Error('Wallet not connected');

    const tier = (data?.tiers ?? []).find(t => t.id === tierId);
    if (!tier) throw new Error('Tier not found');

    setIsSubscribing(true);
    setSubscribeError(null);

    try {
      // Step 1: Discovery POST → get 402 with payTo from SUBSCRIPTION-REQUIRED header or body
      const discoveryRes = await fetch(`${baseUrl}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'WALLET-ADDRESS': payerAddress,
        },
        body: JSON.stringify({ tier_id: tierId }),
      });

      let payTo: string | undefined;

      if (discoveryRes.status === 402) {
        const subHeader = discoveryRes.headers.get('SUBSCRIPTION-REQUIRED');
        if (subHeader) {
          try {
            const decoded = JSON.parse(atob(subHeader));
            payTo = decoded.payTo;
          } catch { /* ignore parse error */ }
        }
        if (!payTo) {
          const body = await discoveryRes.json().catch(() => null);
          payTo = body?.payTo;
        }
      } else if (discoveryRes.ok) {
        // Already subscribed or payment not required — just refetch status
        await queryClient.invalidateQueries({ queryKey: ['agentSubscription', agentTokenId, payerAddress] });
        return;
      }

      if (!payTo) throw new Error('Cannot determine payment recipient. Please try again.');

      // Step 2: Parse tier price → USDC amount (6 decimals)
      const priceFloat = parseFloat(tier.price.replace(/[^0-9.]/g, '') || '0');
      const priceUSDC = BigInt(Math.round(priceFloat * 1_000_000));

      // Step 3: Sign EIP-3009 TransferWithAuthorization
      const provider = await getProvider();
      const walletClient = createWalletClient({
        account: payerAddress as `0x${string}`,
        chain: baseSepolia,
        transport: custom(provider),
      });

      // Ensure external wallet is on Base Sepolia before signing
      await walletClient.switchChain({ id: baseSepolia.id });

      const nonceBytes = crypto.getRandomValues(new Uint8Array(32));
      const nonce = `0x${Array.from(nonceBytes).map(b => b.toString(16).padStart(2, '0')).join('')}` as `0x${string}`;
      const validAfter = BigInt(0);
      const validBefore = BigInt(Math.floor(Date.now() / 1000) + 300); // 5-minute window

      const signature = await walletClient.signTypedData({
        domain: {
          name: 'USDC',
          version: '2',
          chainId: baseSepolia.id,
          verifyingContract: USDC_ADDRESS,
        },
        types: {
          TransferWithAuthorization: [
            { name: 'from', type: 'address' },
            { name: 'to', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'validAfter', type: 'uint256' },
            { name: 'validBefore', type: 'uint256' },
            { name: 'nonce', type: 'bytes32' },
          ],
        },
        primaryType: 'TransferWithAuthorization',
        message: {
          from: payerAddress as `0x${string}`,
          to: payTo as `0x${string}`,
          value: priceUSDC,
          validAfter,
          validBefore,
          nonce,
        },
      });

      // Step 4: Build x402 payment payload → base64 encode
      const paymentPayload = {
        x402Version: 1,
        scheme: 'exact',
        network: 'base-sepolia',
        payload: {
          signature,
          authorization: {
            from: payerAddress,
            to: payTo,
            value: `0x${priceUSDC.toString(16)}`,
            validAfter: '0x0',
            validBefore: `0x${validBefore.toString(16)}`,
            nonce,
          },
        },
      };

      const paymentSignatureHeader = btoa(JSON.stringify(paymentPayload));

      // Step 5: POST with PAYMENT-SIGNATURE → subscription created
      // WALLET-ADDRESS = subscriber identity so the server binds the sub to their primary wallet
      const res = await fetch(`${baseUrl}/subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'WALLET-ADDRESS': payerAddress,
          'PAYMENT-SIGNATURE': paymentSignatureHeader,
        },
        body: JSON.stringify({ tier_id: tierId }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Subscription failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      // Refresh subscription status for the subscriber identity
      await queryClient.invalidateQueries({ queryKey: ['agentSubscription', agentTokenId, payerAddress] });
    } catch (err: any) {
      const message = err.message || 'Failed to subscribe';
      setSubscribeError(message);
      throw err;
    } finally {
      setIsSubscribing(false);
    }
  }, [walletAddress, data, baseUrl, agentTokenId, queryClient]);

  // data === null means the endpoint doesn't exist → no subscription required
  // data !== null means the endpoint responded → subscription is enforced
  const requiresSubscription = data !== null && data !== undefined;

  return {
    subscription: data?.subscription ?? null,
    tiers: data?.tiers ?? [],
    isSubscribed: requiresSubscription ? (data?.subscribed ?? false) : true,
    requiresSubscription,
    isLoading,
    isSubscribing,
    subscribeError,
    subscribe,
    clearSubscribeError: () => setSubscribeError(null),
  };
}
