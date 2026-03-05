import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createWalletClient, createPublicClient, custom, http } from "viem";
import { baseSepolia } from "viem/chains";
import { useWallets } from "@privy-io/react-auth";
import { AgentRouterABI, Contracts } from "@/configs/contracts";
import { useAgentPolicy } from "../hooks/useAgentPolicy";
import PolicyTemplateSelector from "./PolicyTemplateSelector";
import PolicyEditorForm from "./PolicyEditorForm";
import { POLICY_TEMPLATES } from "../utils/policyTemplates";
import type { PolicyStruct } from "../utils/policyTemplates";
import type { AgentInstallation } from "../types/agents.types";

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "84532");

type TxStep =
  | "idle"
  | "selecting"
  | "editing"
  | "confirming"
  | "pending"
  | "syncing"
  | "completed"
  | "error";

interface AuthorizeAgentButtonProps {
  agentTokenId: string;
  walletAddress?: string;
}

export default function AuthorizeAgentButton({
  agentTokenId,
  walletAddress,
}: AuthorizeAgentButtonProps) {
  const [step, setStep] = useState<TxStep>("idle");
  const [error, setError] = useState<string | null>(null);
  const [customPolicy, setCustomPolicy] = useState<PolicyStruct | null>(null);
  const { wallets } = useWallets();
  const queryClient = useQueryClient();

  const { data: policyData } = useAgentPolicy(agentTokenId, walletAddress);
  const isAuthorized =
    policyData?.data &&
    !Array.isArray(policyData.data) &&
    (policyData.data as AgentInstallation).enabled;

  const handleAuthorize = useCallback(
    async (policy: PolicyStruct) => {
      setStep("confirming");
      setError(null);

      try {
        const wallet =
          wallets.find(
            (w) =>
              w.walletClientType === "privy" || w.connectorType === "injected"
          ) || wallets[0];
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
          functionName: "authorize",
          args: [BigInt(agentTokenId), policy as never],
        });

        setStep("pending");
        const hash = await walletClient.writeContract(request);

        setStep("syncing");
        await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });

        queryClient.invalidateQueries({
          queryKey: ["agentPolicy", agentTokenId],
        });
        queryClient.invalidateQueries({ queryKey: ["myAgents"] });
        queryClient.invalidateQueries({ queryKey: ["agent", agentTokenId] });
        setStep("completed");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Transaction failed");
        setStep("error");
      }
    },
    [wallets, walletAddress, agentTokenId, queryClient]
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
        wallets.find(
          (w) =>
            w.walletClientType === "privy" || w.connectorType === "injected"
        ) || wallets[0];
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

      queryClient.invalidateQueries({
        queryKey: ["agentPolicy", agentTokenId],
      });
      queryClient.invalidateQueries({ queryKey: ["myAgents"] });
      setStep("completed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Transaction failed");
      setStep("error");
    }
  }, [wallets, walletAddress, agentTokenId, queryClient]);

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
        <button
          type="button"
          onClick={handleRevoke}
          disabled={isProcessing}
          className="w-full py-3 rounded-lg border border-red-500/20 bg-red-500/10 text-sm text-red-400 font-semibold hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {isProcessing
            ? step === "confirming"
              ? "Confirm in wallet..."
              : step === "pending"
              ? "Transaction pending..."
              : "Syncing..."
            : "Revoke Agent"}
        </button>
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

      {step === "completed" && (
        <p className="text-center text-sm text-green-400">
          {isAuthorized
            ? "Agent revoked successfully"
            : "Agent authorized successfully"}
        </p>
      )}

      {error && <p className="text-center text-sm text-red-400">{error}</p>}
    </div>
  );
}
