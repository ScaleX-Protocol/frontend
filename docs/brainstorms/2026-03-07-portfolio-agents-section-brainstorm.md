# Brainstorm: Portfolio Agents Section

**Date:** 2026-03-07
**Status:** Decided

---

## What We're Building

A dedicated "My Agents" section on the `/portfolio` page that shows the user's authorized AI agents in a horizontal card layout (max 3 visible), with full functionality (revoke, pending actions, recent orders) and a "View all" link to the full `/agents/my` page.

Additionally, remove the standalone "My Agents" navigation button from the `/agents` marketplace page since the portfolio is now the primary entry point.

---

## Why This Approach

The `/portfolio` page is where users manage their assets — agents are an extension of that. Having agent management split across `/agents/my` (a separate navigation destination) creates friction. Surfacing agents on the portfolio page with a compact horizontal preview keeps the workflow unified, while "View all" preserves the full management page for power users.

---

## Key Decisions

### 1. Fix the wallet hook bug (root cause)
- **Problem:** `PortfolioAgents` uses `useWalletState()` which returns null/undefined, silently hiding the section
- **Fix:** Switch to `useWallets()` from `@privy-io/react-auth` (same as `MyAgents.tsx` which works correctly)
- Get address via: `const walletAddress = wallets[0]?.address`

### 2. Horizontal card layout (max 3 cards)
- Show up to 3 agent cards in a horizontal `flex-row` layout
- If user has more than 3 agents, the "View all" link leads to `/agents/my` for the full list
- Cards use the existing `PortfolioAgentCard` component with revoke added

### 3. Add revoke to portfolio agent cards
- Add a revoke button to `PortfolioAgentCard` (currently only in `MyAgentCard`)
- Revoke logic is the same: call AgentRouter contract, invalidate `myAgents` query
- Show confirmation before revoking

### 4. Keep full sections below cards
- **Pending Actions Table** — already exists in `PortfolioAgents`, keep as-is
- **Recent Agent Orders Table** — add `AgentOrdersTable` component (exists in `MyAgents.tsx`) below the cards

### 5. Remove "My Agents" button from `/agents` marketplace
- Remove the secondary "My Agents" button from `AgentMarketplace.tsx`
- The portfolio is now the primary place to manage authorized agents
- `/agents/my` page itself stays (linked from portfolio's "View all")

---

## Files to Change

| File | Change |
|------|--------|
| `PortfolioAgents.tsx` | Fix wallet hook, horizontal layout, add orders table, "View all" to `/agents/my` |
| `PortfolioAgentCard.tsx` | Add revoke button + logic |
| `AgentMarketplace.tsx` | Remove "My Agents" button (desktop + mobile) |

---

## Open Questions

_None — all decisions resolved._

---

## Resolved Questions

- **How many cards visible?** → 3 max, then "View all"
- **What content in section?** → Agent cards (with status + revoke), recent orders table, pending actions table
- **What happens to /agents/my?** → Stays, becomes the "View all" destination
- **What happens to "My Agents" button on /agents?** → Removed
