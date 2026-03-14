import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useReadContract } from "wagmi";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useWallets } from "@privy-io/react-auth";
import { Loader2, CheckCircle2 } from "lucide-react";
import ModalWrapper from "@/components/modals/modalWrapper";
import { AgentRouterABI, Contracts } from "@/configs/contracts";
import PolicyTemplateSelector from "./PolicyTemplateSelector";
import PolicyEditorForm from "./PolicyEditorForm";
import { POLICY_TEMPLATES } from "../utils/policyTemplates";
import type { PolicyStruct } from "../utils/policyTemplates";
import { useAgentSubscription } from "../hooks/useAgentSubscription";
import type { SubscriptionTier } from "../hooks/useAgentSubscription";

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "84532");

type TxStep =
  | "idle"
  | "selecting"
  | "editing"
  | "confirming"
  | "pending"
  | "syncing"
  | "completed"
  | "error"
  | "subscribing";

interface AuthorizeAgentButtonProps {
  agentTokenId: string;
  walletAddress?: string;
  serviceUrl?: string;
}

export default function AuthorizeAgentButton({
  agentTokenId,
  walletAddress,
  serviceUrl,
}: AuthorizeAgentButtonProps) {
  const [step, setStep] = useState<TxStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [customPolicy, setCustomPolicy] = useState<PolicyStruct | null>(null);
  const [subscribingTierId, setSubscribingTierId] = useState<string | null>(null);
  const { wallets } = useWallets();
  const queryClient = useQueryClient();

  // Embedded wallet is required for subscription payments (EIP-3009 signing)
  const embeddedWallet = wallets.find((w) => w.walletClientType === "privy");

  // Read authorization status directly from the contract — source of truth
  const { data: isAuthorized, refetch: refetchAuthorized } = useReadContract({
    address: Contracts[CHAIN_ID].agentRouterAddress,
    abi: AgentRouterABI,
    functionName: "isAuthorized",
    args: walletAddress ? [walletAddress as `0x${string}`, BigInt(agentTokenId)] : undefined,
    query: { enabled: !!walletAddress },
  });

  const {
    tiers,
    isSubscribed,
    isSubscribing,
    subscribeError,
    subscribe,
    clearSubscribeError,
  } = useAgentSubscription(agentTokenId, serviceUrl, embeddedWallet?.address);

  const handleSubscribe = useCallback(async (tierId: string) => {
    if (!embeddedWallet) return;
    setSubscribingTierId(tierId);
    clearSubscribeError();
    try {
      await subscribe(tierId, embeddedWallet.address, () => embeddedWallet.getEthereumProvider());
      setStep("idle");
    } catch {
      // error stored in subscribeError
    } finally {
      setSubscribingTierId(null);
    }
  }, [embeddedWallet, subscribe, clearSubscribeError]);

  const handleAuthorize = useCallback(
    async (policy: PolicyStruct) => {
      setStep("confirming");
      setError(null);

      try {
        // Must use the wallet that owns walletAddress (the Privy embedded wallet).
        // Using an injected wallet's provider with a different account address causes
        // "The requested account has not been authorized by the user" errors.
        const wallet =
          wallets.find((w) => w.walletClientType === "privy") || wallets[0];
        if (!wallet) throw new Error("No wallet connected");

        await wallet.switchChain(CHAIN_ID);
        const provider = await wallet.getEthereumProvider();

        const walletClient = createWalletClient({
          account: walletAddress as `0x${string}`,
          chain: baseSepolia,
          transport: custom(provider),
        });

        const publicClient = createPublicClient({
          chain: baseSepolia,
          transport: http(),
        });

        // Check on-chain if a policy already exists for this user+agent (even if disabled).
        // installPolicyFor reverts if installedAt != 0, so we must revoke first.
        const existingPolicy = await publicClient.readContract({
          address: Contracts[CHAIN_ID].agentRouterAddress,
          abi: AgentRouterABI,
          functionName: "isAuthorized",
          args: [walletAddress as `0x${string}`, BigInt(agentTokenId)],
        });

        if (existingPolicy) {
          // Policy already installed (possibly disabled) — revoke first
          const { request: revokeRequest } = await publicClient.simulateContract({
            account: walletAddress as `0x${string}`,
            address: Contracts[CHAIN_ID].agentRouterAddress,
            abi: AgentRouterABI,
            functionName: "revoke",
            args: [BigInt(agentTokenId)],
          });
          setStep("pending");
          const revokeHash = await walletClient.writeContract(revokeRequest);
          setStep("syncing");
          await publicClient.waitForTransactionReceipt({ hash: revokeHash, timeout: 60_000 });
          setStep("confirming");
        }

        const { request } = await publicClient.simulateContract({
          account: walletAddress as `0x${string}`,
          address: Contracts[CHAIN_ID].agentRouterAddress,
          abi: AgentRouterABI,
          functionName: "authorize",
          args: [BigInt(agentTokenId), policy as never],
        });

        setStep("pending");
        const hash = await walletClient.writeContract(request);

        setStep("syncing");
        await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });

        queryClient.invalidateQueries({ queryKey: ["agentPolicy", agentTokenId] });
        queryClient.invalidateQueries({ queryKey: ["myAgents"] });
        queryClient.invalidateQueries({ queryKey: ["agent", agentTokenId] });
        refetchAuthorized();
        setStep("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        setStep("error");
      }
    },
    [wallets, walletAddress, agentTokenId, queryClient, refetchAuthorized]
  );

  const handleRevoke = useCallback(async () => {
    if (
      !confirm(
        "Are you sure you want to revoke this agent? It will no longer be able to trade on your behalf."
      )
    )
      return;

    setStep("confirming");
    setError(null);

    try {
      const wallet =
        wallets.find((w) => w.walletClientType === "privy") || wallets[0];
      if (!wallet) throw new Error("No wallet connected");

      await wallet.switchChain(CHAIN_ID);
      const provider = await wallet.getEthereumProvider();

      const walletClient = createWalletClient({
        account: walletAddress as `0x${string}`,
        chain: baseSepolia,
        transport: custom(provider),
      });

      const publicClient = createPublicClient({
        chain: baseSepolia,
        transport: http(),
      });

      const { request } = await publicClient.simulateContract({
        account: walletAddress as `0x${string}`,
        address: Contracts[CHAIN_ID].agentRouterAddress,
        abi: AgentRouterABI,
        functionName: "revoke",
        args: [BigInt(agentTokenId)],
      });

      setStep("pending");
      const hash = await walletClient.writeContract(request);

      setStep("syncing");
      await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });

      queryClient.invalidateQueries({ queryKey: ["agentPolicy", agentTokenId] });
      queryClient.invalidateQueries({ queryKey: ["myAgents"] });
      refetchAuthorized();
      setStep("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  }, [wallets, walletAddress, agentTokenId, queryClient, refetchAuthorized]);

  if (!walletAddress) {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 rounded-lg bg-[#1A1A1A] text-sm text-[#606060] font-semibold cursor-not-allowed"
      >
        Connect Wallet to Authorize
      </button>
    );
  }

  if (step === "selecting") {
    return (
      <PolicyTemplateSelector
        onSelect={handleAuthorize}
        onCustomize={(templateIndex) => {
          // If templateIndex is provided, start from that template
          const basePolicy =
            templateIndex !== undefined
              ? POLICY_TEMPLATES[templateIndex].policy
              : POLICY_TEMPLATES[1].policy; // Default to Moderate template
          setCustomPolicy(basePolicy);
          setStep("editing");
        }}
        onCancel={() => setStep("idle")}
        isLoading={false}
      />
    );
  }

  if (step === "editing" && customPolicy) {
    return (
      <PolicyEditorForm
        initialPolicy={customPolicy}
        onSave={handleAuthorize}
        onCancel={() => {
          setCustomPolicy(null);
          setStep("selecting");
        }}
        isLoading={false}
      />
    );
  }

  const isProcessing =
    step === "confirming" || step === "pending" || step === "syncing";

  return (
    <div className="space-y-2">
      {isAuthorized ? (
        <>
          <button
            type="button"
            onClick={() => setStep("subscribing")}
            disabled={isProcessing || isSubscribed}
            className="w-full py-3 rounded-lg btn-primary justify-center text-sm text-white font-semibold transition-colors disabled:opacity-50"
          >
            {isSubscribed ? "Subscribed" : "Subscribe"}
          </button>
          <button
            type="button"
            onClick={handleRevoke}
            disabled={isProcessing}
            className="w-full text-center text-xs text-[#606060] hover:text-red-400 transition-colors disabled:opacity-50"
          >
            Revoke Authorization
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={() => setStep("selecting")}
          disabled={isProcessing}
          className="w-full py-3 rounded-lg btn-primary justify-center text-sm text-white font-semibold transition-colors disabled:opacity-50"
        >
          {isProcessing
            ? step === "confirming"
              ? "Confirm in wallet..."
              : step === "pending"
              ? "Transaction pending..."
              : "Syncing..."
            : "Authorize Agent"}
        </button>
      )}

      {step === "completed" && !isProcessing && (
        <p className="text-center text-sm text-green-400">
          {isAuthorized ? "Agent authorized successfully" : "Agent revoked successfully"}
        </p>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}

      <ModalWrapper
        isOpen={step === "subscribing"}
        onClose={() => {
          setStep("idle");
          clearSubscribeError();
        }}
        title="Choose a plan"
        maxWidth="max-w-[500px]"
      >
        <div className="px-6 py-5 space-y-5">
          {tiers.length === 0 ? (
            <p className="text-center text-[#606060] text-sm py-8">
              No subscription plans available.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {tiers.map((tier) => (
                <SubscribeTierCard
                  key={tier.id}
                  tier={tier}
                  isSubscribing={isSubscribing}
                  isThisTierSubscribing={subscribingTierId === tier.id}
                  onSubscribe={handleSubscribe}
                />
              ))}
            </div>
          )}

          {subscribeError && (
            <p className="text-center text-xs text-red-400">{subscribeError}</p>
          )}

          <p className="text-[#505050] text-xs text-center border-t border-[#1F1F1F] pt-4 mt-2">
            Payments settled on-chain via x402 · USDC on Base Sepolia
          </p>
        </div>
      </ModalWrapper>
    </div>
  );
}

// ─── Tier Card ────────────────────────────────────────────────────────────────

const TIER_STYLES: Record<string, { badge: string; button: string; border: string }> = {
  free:       { badge: "bg-green-500/10 text-green-400",   button: "bg-green-600 hover:bg-green-700",   border: "border-green-500/20" },
  basic:      { badge: "bg-blue-500/10 text-blue-400",     button: "bg-blue-600 hover:bg-blue-700",     border: "border-blue-500/20" },
  pro:        { badge: "bg-[#F06718]/10 text-[#F06718]",   button: "bg-[#F06718] hover:bg-[#E05608]",   border: "border-[#F06718]/30" },
  enterprise: { badge: "bg-purple-500/10 text-purple-400", button: "bg-purple-700 hover:bg-purple-800", border: "border-purple-500/20" },
};

function SubscribeTierCard({
  tier,
  isSubscribing,
  isThisTierSubscribing,
  onSubscribe,
}: {
  tier: SubscriptionTier;
  isSubscribing: boolean;
  isThisTierSubscribing: boolean;
  onSubscribe: (id: string) => void;
}) {
  const style = TIER_STYLES[tier.id] ?? TIER_STYLES.basic;
  const isPro = tier.id === "pro";

  return (
    <div className={`relative flex flex-col rounded-xl border bg-[#111111] p-3 ${style.border} ${isPro ? "ring-1 ring-[#F06718]/30" : ""}`}>
      {isPro && (
        <span className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-[#F06718] text-white text-[10px] font-semibold">
          Popular
        </span>
      )}
      <div className="mb-2">
        <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${style.badge}`}>{tier.name}</span>
        <p className="text-[#E0E0E0] font-bold text-lg leading-tight mt-1">{tier.price}</p>
        <p className="text-[#606060] text-[11px]">{tier.duration_days}d · {tier.chat_limit} chats</p>
      </div>
      <ul className="space-y-1 mb-3 flex-1">
        {(tier.features ?? []).slice(0, 3).map((f, i) => (
          <li key={i} className="flex items-start gap-1.5">
            <CheckCircle2 size={11} className="text-[#606060] shrink-0 mt-0.5" />
            <span className="text-[#808080] text-[11px] leading-tight">{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={() => onSubscribe(tier.id)}
        disabled={isSubscribing}
        className={`w-full py-1.5 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 ${style.button}`}
      >
        {isThisTierSubscribing ? (
          <><Loader2 size={11} className="animate-spin" /> Signing...</>
        ) : (
          tier.price === "$0" ? "Get Free" : "Subscribe"
        )}
      </button>
    </div>
  );
}
