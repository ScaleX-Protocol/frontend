---
title: "feat: Portfolio Authorized Agents Section"
type: feat
status: active
date: 2026-03-07
brainstorm: docs/brainstorms/2026-03-07-portfolio-agents-section-brainstorm.md
---

# feat: Portfolio Authorized Agents Section

## Overview

Consolidate "My Agents" management into the portfolio page by:
1. Fixing a silent rendering bug in `PortfolioAgents` (wrong wallet hook)
2. Redesigning the agents section with a horizontal card layout (max 3) + "View all" link
3. Adding revoke capability and recent orders table to the portfolio agents section
4. Removing the redundant "My Agents" navigation button from the `/agents` marketplace page

## Problem Statement

- `PortfolioAgents` uses `useWalletState()` which returns `null` address → section silently hides even when agents are authorized
- `MyAgents` page uses `useWallets()` from `@privy-io/react-auth` which correctly resolves the address
- The "My Agents" experience is fragmented across two separate navigation destinations (`/agents` button → `/agents/my`)
- Portfolio is the right home for agent management — it's where users manage their assets

## Files to Change

| File | Change |
|------|--------|
| `PortfolioAgents.tsx` | Fix wallet hook, horizontal layout, add orders table, "View all" link |
| `PortfolioAgentCard.tsx` | Add revoke button + props |
| `AgentMarketplace.tsx` | Remove "My Agents" button (desktop + mobile) |

## Implementation Plan

### Step 1 — Fix `PortfolioAgents.tsx`

**File:** `apps/web/src/features/portfolio/components/agents/PortfolioAgents.tsx`

**Changes:**

1. **Fix wallet hook** — replace `useWalletState()` with `useWallets()` from Privy:
   ```tsx
   // Before (broken)
   import { useWalletState } from "@/hooks/useWalletState";
   const wallet = useWalletState();
   const address = wallet?.address;

   // After (matches MyAgents.tsx pattern)
   import { useWallets } from "@privy-io/react-auth";
   const { wallets } = useWallets();
   const address = wallets[0]?.address;
   ```

2. **Add revoke logic** (same viem pattern as `MyAgents.tsx` lines 23-64):
   ```tsx
   import { useState, useCallback } from "react";
   import { useWallets } from "@privy-io/react-auth";
   import { createWalletClient, createPublicClient, custom, http } from "viem";
   import { baseSepolia } from "viem/chains";
   import { useQueryClient } from "@tanstack/react-query";
   import { AgentRouterABI, Contracts } from "@/configs/contracts";

   const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || "84532");
   const [revokingId, setRevokingId] = useState<string | null>(null);
   const queryClient = useQueryClient();

   const handleRevoke = useCallback(async (agentTokenId: string) => {
     if (!confirm("Revoke this agent? It will no longer trade on your behalf.")) return;
     if (!address) return;
     setRevokingId(agentTokenId);
     try {
       const wallet = wallets.find((w) => w.walletClientType === "privy") || wallets[0];
       if (!wallet) throw new Error("No wallet");
       await wallet.switchChain(CHAIN_ID);
       const provider = await wallet.getEthereumProvider();
       const walletClient = createWalletClient({ account: address as `0x${string}`, chain: baseSepolia, transport: custom(provider) });
       const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
       const { request } = await publicClient.simulateContract({
         account: address as `0x${string}`,
         address: Contracts[CHAIN_ID].agentRouterAddress,
         abi: AgentRouterABI,
         functionName: "revoke",
         args: [BigInt(agentTokenId)],
       });
       const hash = await walletClient.writeContract(request);
       await publicClient.waitForTransactionReceipt({ hash, timeout: 60_000 });
       queryClient.invalidateQueries({ queryKey: ["myAgents"] });
     } catch (err) {
       console.error("Revoke failed:", err);
     } finally {
       setRevokingId(null);
     }
   }, [wallets, address, queryClient]);
   ```

3. **Change card grid to horizontal flex row** (max 3 cards):
   ```tsx
   // Before: vertical/responsive grid
   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

   // After: horizontal flex row, show first 3
   <div className="flex flex-row gap-4 overflow-x-auto">
     {agents.slice(0, 3).map((agent) => (
       <div key={agent.agentTokenId} className="min-w-[280px] flex-shrink-0">
         <PortfolioAgentCard
           agent={agent}
           pendingCount={pendingByAgent.get(agent.agentTokenId) || 0}
           onRevoke={handleRevoke}
           isRevoking={revokingId === agent.agentTokenId}
         />
       </div>
     ))}
   </div>
   ```

4. **Update header** — change "View All Agents" link from `/agents` to `/agents/my`:
   ```tsx
   // Before
   <Link to="/agents">View All Agents</Link>

   // After
   <Link to="/agents/my">View all</Link>
   ```

5. **Add `AgentOrdersTable` below pending actions** (when agents exist):
   ```tsx
   import AgentOrdersTable from "@/features/agents/components/AgentOrdersTable";

   {/* After PendingActionsTable */}
   {agents.length > 0 && (
     <div>
       <h3 className="text-sm font-medium text-[#E0E0E0] mb-3">Recent Agent Orders</h3>
       <AgentOrdersTable agentTokenId={agents[0].agentTokenId} />
     </div>
   )}
   ```

6. **Remove the `if (!agentsLoading && ... agents.length === 0 && ...)` early return** — always show section when wallet is connected (with empty state):
   - Keep the `if (!address) return null` guard
   - Remove the second early return that hides section when no agents
   - The empty state UI (Bot icon + "No agents authorized yet") will handle the zero state

---

### Step 2 — Update `PortfolioAgentCard.tsx`

**File:** `apps/web/src/features/portfolio/components/agents/PortfolioAgentCard.tsx`

**Changes:**

1. **Add revoke props to interface:**
   ```tsx
   interface PortfolioAgentCardProps {
     agent: AgentInstallation;
     pendingCount: number;
     onRevoke: (agentTokenId: string) => void;   // new
     isRevoking?: boolean;                        // new
   }
   ```

2. **Add revoke button to card footer** (match `MyAgentCard` pattern, lines 75-79):
   ```tsx
   // In card footer area
   <button
     onClick={() => onRevoke(agent.agentTokenId)}
     disabled={isRevoking}
     className="text-xs text-[#606060] hover:text-red-400 transition-colors disabled:opacity-50"
   >
     {isRevoking ? "Revoking..." : "Revoke"}
   </button>
   ```

---

### Step 3 — Remove "My Agents" Button from `AgentMarketplace.tsx`

**File:** `apps/web/src/features/agents/components/AgentMarketplace.tsx`

**Changes:**

Remove the "My Agents" link button in both desktop (lines 74-79) and mobile (lines 94-99) sections:

```tsx
// Remove this block (desktop, ~lines 74-79):
<Link to="/agents/my" className="...">
  My Agents
</Link>

// Remove this block (mobile, ~lines 94-99):
<Link to="/agents/my" className="...">
  My Agents
</Link>
```

---

## Acceptance Criteria

- [ ] `PortfolioAgents` section renders on `/portfolio` when wallet is connected and has authorized agents
- [ ] Agent cards display in a horizontal row (max 3 visible)
- [ ] "View all" link navigates to `/agents/my`
- [ ] Each portfolio agent card has a working "Revoke" button
- [ ] Revoking an agent shows loading state and refreshes the list
- [ ] `AgentOrdersTable` displays below the agent cards when agents exist
- [ ] Pending actions table still renders correctly
- [ ] When no agents: empty state shows (Bot icon + "No agents authorized yet" + Browse Agents link)
- [ ] "My Agents" button is removed from `/agents` marketplace page (desktop + mobile)
- [ ] Section does not render when wallet is disconnected

## References

- Brainstorm: `docs/brainstorms/2026-03-07-portfolio-agents-section-brainstorm.md`
- Root cause: `PortfolioAgents.tsx:12-13` uses `useWalletState()` vs working pattern at `MyAgents.tsx:16-17` with `useWallets()`
- Revoke pattern: `AuthorizeAgentButton.tsx:161-213`
- `AgentOrdersTable` props: `AgentOrdersTable.tsx:6-8` — takes `{ agentTokenId: string }`
- Marketplace buttons to remove: `AgentMarketplace.tsx:74-79` (desktop), `AgentMarketplace.tsx:94-99` (mobile)
