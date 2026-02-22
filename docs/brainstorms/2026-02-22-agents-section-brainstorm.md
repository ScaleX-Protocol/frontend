# Agents Section — Frontend Pages

**Date:** 2026-02-22
**Status:** Draft

## What We're Building

A 3-page agents section for the ScaleX frontend that allows wallet owners to:
1. **Discover** AI trading agents in a marketplace
2. **Inspect** agent performance, orders, and policies before authorizing
3. **Monitor** their authorized agents with a rich dashboard

The agents system is built on **ERC-8004** — each agent is an on-chain NFT identity. Users authorize agents via `AgentRouter.authorize(strategyAgentId, policy)` to let the agent trade using the user's BalanceManager funds. Users can revoke at any time.

## Why This Approach

**Marketplace-First (Approach A)** was chosen over Portfolio-First and Unified Dashboard because:
- Discovery-driven flow mirrors how DeFi users explore protocols
- Encourages adoption by showcasing agent performance upfront
- The rich data available (analytics, orders, lending, violations, circuit breakers) needs a full detail page, not a cramped slide-out panel
- Returning users can quickly navigate to "My Agents" from the sidebar

## Pages

### Page 1: Agent Marketplace (`/agents`)

Grid of agent cards showing:
- **Basic info:** Agent token ID, executor address (truncated)
- **Performance:** Total trading volume, total orders (market + limit), win rate / PnL from analytics endpoint
- **Social proof:** Active users count, total users who installed

Data sources:
- `GET /api/agents` — lists all agents with aggregated stats (totalUsers, activeUsers, totalTradingVolume, totalMarketOrders, totalLimitOrders, lastActivityAt)

Features:
- Search/filter by performance metrics
- Sort by volume, users, activity
- Empty state for when few agents exist

### Page 2: Agent Detail (`/agents/:agentTokenId`)

Performance dashboard for a single agent:
- **Header:** Agent token ID, executor address, first installed date, active/total users
- **Analytics section:** PnL, win rate, fill rate (from `/api/agents/:id/analytics`)
- **Stats section:** Trading volume, order counts, lending totals (from `/api/agents/:id/stats`)
- **Orders table:** Recent orders with status, side, price, quantity (from `/api/agents/:id/orders`)
- **Lending activity:** Borrow/repay/supply/withdraw events (from `/api/agents/:id/lending`)
- **Safety section:** Policy violations and circuit breaker events (from `/api/agents/:id/violations` and `/api/agents/:id/circuit-breakers`)
- **Policy section:** Default policy configuration (from `/api/agents/:id/policy`)

**Primary CTA:** "Authorize Agent" button
- Triggers on-chain `AgentRouter.authorize()` via connected Privy wallet
- User configures policy parameters before authorizing (template selection: conservative/moderate/aggressive/custom)
- Shows "Revoke" button if user has already authorized this agent

### Page 3: My Agents (`/agents/my`)

Rich dashboard of agents the connected user has authorized:
- **Agent cards** with status (enabled/disabled), last activity, key stats
- **Execution timeline chart** (using Recharts) showing trade activity over time
- **P&L tracking** per agent
- **Trade history table** — all orders placed by authorized agents for this user
- **Quick actions:** Revoke authorization, view policy, navigate to detail page

Data sources:
- `GET /api/agents?owner={walletAddress}` — user's installed agents
- `GET /api/policies?owner={walletAddress}` — user's agent policies
- Per-agent: `/api/agents/:id/stats`, `/api/agents/:id/orders`, `/api/agents/:id/analytics`

Requires: Connected wallet (show connect prompt if not connected)

## Key Decisions

1. **Marketplace-first navigation** — `/agents` lands on marketplace, not user's agents
2. **On-chain authorization** — "Authorize Agent" triggers `AgentRouter.authorize()` via Privy wallet SDK
3. **Self-hosted agents** — Users authorize agents to trade on their behalf; agents run on separate infrastructure
4. **3-page structure** — Marketplace, Detail, My Agents (not tabs or slide-out)
5. **Rich monitoring** — Execution charts, P&L, order tables, violations, circuit breakers on both detail and my-agents pages
6. **Policy template selection** — Users pick from conservative/moderate/aggressive/custom when authorizing

## Technical Notes

- **Router:** Add 3 routes to TanStack Router in `router.tsx`
- **Navigation:** Add "Agents" item to sidebar (`components/sidebar.tsx`) and bottom nav (`components/bottom-nav.tsx`)
- **API base:** `https://base-sepolia-indexer.scalex.money` (same as existing API client)
- **Wallet interaction:** Use Privy SDK (`@privy-io/react-auth`) + wagmi/viem for on-chain calls
- **Charts:** Recharts (already in project) for execution timeline and P&L
- **UI components:** Leverage existing `components/ui/` (card, button, toast, etc.)
- **Contract addresses:**
  - AgentRouter: `0xE9c1a6665364294194aa3B1CE89654926b338493`
  - IdentityRegistry: `0xC2A65565d9E4D901B80a38872688B23B2F8d0975`

## Open Questions

None — all key decisions resolved through brainstorming.
