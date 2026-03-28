---
title: "feat: Add Agents Section with Marketplace, Detail, and My Agents Pages"
type: feat
status: completed
date: 2026-02-22
brainstorm: docs/brainstorms/2026-02-22-agents-section-brainstorm.md
---

# feat: Add Agents Section with Marketplace, Detail, and My Agents Pages

## Overview

Add a 3-page Agents section to the ScaleX frontend allowing wallet owners to discover AI trading agents in a marketplace, inspect their on-chain performance, authorize agents to manage their portfolio via ERC-8004 on-chain transactions, and monitor authorized agents through a rich dashboard.

## Problem Statement / Motivation

The ERC-8004 agent system and backend API endpoints are fully built, but there's no frontend UI for users to interact with agents. Users currently have no way to:
- Discover available trading agents
- View agent performance before committing
- Authorize/revoke agents through a UI (currently CLI-only via `cast` commands)
- Monitor their authorized agents' trading activity

## Proposed Solution

Three new pages following existing frontend conventions:

1. **`/agents`** — Marketplace grid of all registered agents
2. **`/agents/:agentTokenId`** — Agent detail with performance dashboard + authorize/revoke CTA
3. **`/agents/my`** — Connected user's authorized agents dashboard

### Architecture

```
apps/web/src/
├── pages/
│   ├── agents.tsx                    # Marketplace page shell
│   ├── agent-detail.tsx              # Detail page shell
│   └── my-agents.tsx                 # My Agents page shell
├── features/agents/
│   ├── components/
│   │   ├── AgentMarketplace.tsx      # Marketplace grid + cards
│   │   ├── AgentCard.tsx             # Individual agent card
│   │   ├── AgentDetail.tsx           # Detail page content
│   │   ├── AgentAnalytics.tsx        # PnL, win rate, fill rate section
│   │   ├── AgentOrdersTable.tsx      # Orders table (reuse TanStack Table)
│   │   ├── AgentPolicyDisplay.tsx    # Policy visualization
│   │   ├── AgentSafetySection.tsx    # Violations + circuit breakers
│   │   ├── AuthorizeAgentButton.tsx  # Authorize/Revoke CTA with tx flow
│   │   ├── PolicyTemplateSelector.tsx # Template picker for authorization
│   │   ├── MyAgents.tsx              # My Agents dashboard
│   │   └── MyAgentCard.tsx           # Agent card with stats + revoke
│   ├── hooks/
│   │   ├── useAgents.ts             # GET /api/agents (marketplace list)
│   │   ├── useAgent.ts              # GET /api/agents/:id (single agent)
│   │   ├── useAgentAnalytics.ts     # GET /api/agents/:id/analytics
│   │   ├── useAgentStats.ts         # GET /api/agents/:id/stats
│   │   ├── useAgentOrders.ts        # GET /api/agents/:id/orders
│   │   ├── useAgentLending.ts       # GET /api/agents/:id/lending
│   │   ├── useAgentViolations.ts    # GET /api/agents/:id/violations
│   │   ├── useAgentCircuitBreakers.ts # GET /api/agents/:id/circuit-breakers
│   │   ├── useAgentPolicy.ts        # GET /api/agents/:id/policy
│   │   ├── useMyAgents.ts           # GET /api/agents?owner=<wallet>
│   │   ├── useAuthorizeAgent.ts     # On-chain authorize transaction
│   │   └── useRevokeAgent.ts        # On-chain revoke transaction
│   ├── types/
│   │   └── agents.types.ts          # TypeScript types for all agent data
│   └── utils/
│       ├── formatPolicy.ts          # Human-readable policy formatting
│       └── policyTemplates.ts       # Conservative/moderate/aggressive presets
```

## Implementation Phases

### Phase 1: Foundation (Types, Hooks, Router, Navigation)

**1.1 TypeScript types** (`features/agents/types/agents.types.ts`)

Define interfaces matching all API response shapes:
- `Agent` — marketplace card data (agentTokenId, totalUsers, activeUsers, totalTradingVolume, etc.)
- `AgentDetail` — single agent with full stats
- `AgentAnalytics` — PnL, win rate, fill rate
- `AgentStats` — order counts, volume, lending totals
- `AgentOrder` — order record
- `AgentPolicy` — 30+ policy fields
- `AgentViolation`, `AgentCircuitBreaker`, `AgentLendingEvent`

**1.2 Data-fetching hooks** (`features/agents/hooks/`)

All hooks follow existing pattern from `useLendingDashboard`:
```tsx
// Example: useAgents.ts
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';

export function useAgents() {
  return useQuery({
    queryKey: ['agents'],
    queryFn: () => fetchIndexerAPI<AgentsResponse>('/agents'),
    staleTime: 30_000,
  });
}
```

Key hooks:
- `useAgents()` — calls `GET /api/agents` (no owner filter = marketplace view)
- `useAgent(agentTokenId)` — calls `GET /api/agents/:id`
- `useAgentAnalytics(agentTokenId)` — calls `GET /api/agents/:id/analytics`
- `useMyAgents(ownerAddress)` — calls `GET /api/agents?owner=<address>` with `enabled: !!ownerAddress`

**1.3 Router configuration** (`router.tsx`)

Add 3 routes. **Critical: static `/agents/my` must be defined BEFORE dynamic `/agents/:agentTokenId`** to prevent TanStack Router from matching `my` as a token ID.

```tsx
import AgentsPage from '@/pages/agents';
import AgentDetailPage from '@/pages/agent-detail';
import MyAgentsPage from '@/pages/my-agents';

const agentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents',
  component: AgentsPage,
});

// MUST come before agentDetailRoute
const myAgentsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents/my',
  component: MyAgentsPage,
});

const agentDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/agents/$agentTokenId',
  component: AgentDetailPage,
});

// In addChildren: [..., agentsRoute, myAgentsRoute, agentDetailRoute, ...]
```

**1.4 Navigation** — update both files:

`components/layout/Sidebar.tsx` and `components/layout/BottomNavigation.tsx`:
```tsx
// Add to navItems array (before Faucet):
{ label: 'Agents', path: '/agents', icon: <Bot size={20} /> }
```

Update `isActive()` to handle prefix matching for `/agents` routes.

**1.5 Page shells** — 3 thin page files following existing pattern:

```tsx
// pages/agents.tsx
import AppHeader from '@/components/appHeader';
import AgentMarketplace from '@/features/agents/components/AgentMarketplace';

export default function AgentsPage() {
  return (
    <div className="w-full min-h-screen bg-black text-[#E0E0E0] flex flex-col">
      <AppHeader />
      <AgentMarketplace />
    </div>
  );
}
```

### Phase 2: Marketplace Page (`/agents`)

**`AgentMarketplace.tsx`** — Grid layout of `AgentCard` components.

- Calls `useAgents()` to fetch all agents
- Responsive grid: 1 col mobile, 2 col tablet, 3 col desktop
- Sort dropdown: Volume (default), Users, Recent Activity
- Loading state: skeleton cards
- Empty state: "No agents registered yet" message

**`AgentCard.tsx`** — Individual card in the marketplace grid.

Each card displays:
- Agent Token ID (formatted as `Agent #0`)
- Active users / Total users count
- Total trading volume (formatted from BigInt string with IDRX decimals)
- Total orders (market + limit)
- Last activity timestamp (relative: "2 hours ago")
- Click navigates to `/agents/:agentTokenId`

Uses existing `card.tsx` UI component with dark theme styling.

### Phase 3: Agent Detail Page (`/agents/:agentTokenId`)

**`AgentDetail.tsx`** — Full detail page with multiple data sections loaded in parallel.

Sections (each with independent loading/error states):

1. **Header**: Agent token ID, first installed date, active/total users
2. **Analytics** (`AgentAnalytics.tsx`): PnL, win rate, fill rate from `/analytics` endpoint. Display as stat cards.
3. **Stats**: Trading volume, order counts, lending totals from `/stats` endpoint
4. **Orders Table** (`AgentOrdersTable.tsx`): Using TanStack Table (already in project). Columns: Order ID, Side, Type, Price, Quantity, Status, Timestamp. Pagination via API `limit`/`offset`.
5. **Lending Activity**: Borrow/repay/supply/withdraw events from `/lending`
6. **Safety** (`AgentSafetySection.tsx`): Policy violations and circuit breaker events from `/violations` and `/circuit-breakers`
7. **Policy** (`AgentPolicyDisplay.tsx`): Human-readable policy display. Group 30+ fields into categories (Trading Permissions, Risk Limits, Time Restrictions, Advanced). Show boolean fields as badges, BigInt.max as "Unlimited", basis points as percentages.

**Primary CTA** (`AuthorizeAgentButton.tsx`):
- If wallet not connected: "Connect Wallet to Authorize" (triggers Privy login)
- If already authorized (check via `GET /api/agents/:id/policy?owner=<wallet>`): Show "Revoke Agent" button
- If not authorized: Show "Authorize Agent" button → opens `PolicyTemplateSelector`

### Phase 4: Authorization & Revocation Flow

**`PolicyTemplateSelector.tsx`** — Modal/sheet for choosing policy template before authorizing.

Templates (from `policyTemplates.ts`):
- **Conservative**: Small order sizes, no borrowing, tight slippage, short trading hours
- **Moderate**: Medium limits, borrowing allowed with health factor guard
- **Aggressive**: Large limits, all permissions, wide slippage tolerance
- **Custom**: (Future) Full policy editor form

Each template shows a summary of key parameters. User selects template → confirms → triggers transaction.

**`useAuthorizeAgent.ts`** — On-chain transaction hook following `useDeposit.ts` pattern:

```
States: IDLE → VALIDATING → AWAITING_SIGNATURE → PENDING → CONFIRMING → SYNCING → COMPLETED | ERROR
```

Steps:
1. Validate: Check wallet connected, correct chain (84532), agent exists
2. Chain switch: If wrong chain, call `wallet.switchChain(84532)`
3. Build policy struct from selected template
4. Create viem wallet client from Privy provider
5. Simulate `AgentRouter.authorize(agentTokenId, policyStruct)`
6. Execute `writeContract()`
7. Wait for receipt
8. Wait for indexer sync (using existing `waitForIndexerSync` pattern)
9. Invalidate TanStack Query cache for agent data
10. Show success toast

**`useRevokeAgent.ts`** — Similar flow but calls `AgentRouter.revoke(agentTokenId)`.

Before revoking, check for open orders via `GET /api/agents/:id/orders?status=OPEN&owner=<wallet>` and warn user if any exist.

**ABI Requirement**: The `AgentRouter` ABI with `authorize(uint256, tuple)` and `revoke(uint256)` must be added to `configs/contracts.ts`. The Policy struct ABI must match the on-chain Solidity definition exactly. Source from the deployed contract or `clob-dex` repo's Forge artifacts.

### Phase 5: My Agents Page (`/agents/my`)

**`MyAgents.tsx`** — Dashboard for the connected user's authorized agents.

- Requires connected wallet. If not connected: show "Connect your wallet to view your agents" prompt.
- Calls `useMyAgents(walletAddress)` → `GET /api/agents?owner=<address>`
- For each agent, fetches stats and analytics in parallel

Content:
1. **Agent cards** (`MyAgentCard.tsx`): Status badge (enabled/disabled), agent token ID, last activity, key stats (volume, orders), quick "Revoke" button, click to navigate to detail page
2. **Execution timeline chart** (Recharts): X-axis = time (7-day default), Y-axis = order count. Data from aggregating agent orders by timestamp. Time range selector (24h/7d/30d).
3. **Trade history table**: All orders across authorized agents, sortable by date. Reuse `AgentOrdersTable` component.

Empty state: "You haven't authorized any agents yet. Browse the marketplace to get started." with link to `/agents`.

## Technical Considerations

### Contract ABI

The `authorize()` and `revoke()` function ABIs are **not yet in the frontend codebase**. They must be sourced from:
- The `clob-dex` repo's compiled artifacts, or
- Reading from the deployed AgentRouter contract ABI

Add to `apps/web/src/configs/contracts.ts`:
```tsx
export const AgentRouterAddress = '0xE9c1a6665364294194aa3B1CE89654926b338493';
export const AgentRouterABI = [...] as const; // Must include authorize, revoke, isAuthorized
```

### Route Disambiguation

TanStack Router processes routes in definition order. `/agents/my` MUST be defined before `/agents/$agentTokenId`. Additionally, validate `agentTokenId` as a numeric string in the detail page component to handle direct navigation to invalid IDs gracefully.

### BigInt String Formatting

All API responses return numeric values as decimal strings. Create a utility for human-readable formatting:
- `formatTokenAmount(value: string, decimals: number)` — e.g., `"1000000000"` with 6 decimals → `"1,000"`
- `formatBigIntMax(value: string)` — returns `"Unlimited"` for `uint256.max`
- `formatBps(value: string)` — e.g., `"500"` → `"5%"`

### Indexer Sync After Transactions

After authorize/revoke transactions confirm on-chain, the indexer needs time to process the block. Follow existing `waitForIndexerSync` pattern to poll until the indexer catches up before refreshing data.

### Chain Verification

Before any on-chain transaction, verify the user is on Base Sepolia (chain ID 84532). If wrong chain, use Privy's `wallet.switchChain()`. Follow existing pattern from `useDeposit.ts`.

## System-Wide Impact

- **Router**: 3 new routes added to `router.tsx`
- **Navigation**: 1 new nav item in Sidebar + BottomNavigation (both must stay in sync)
- **API client**: Uses existing `fetchIndexerAPI` — no new infrastructure
- **Contract config**: New ABI + address added to `configs/contracts.ts`
- **No breaking changes**: Purely additive — new feature module, pages, and routes

## Acceptance Criteria

### Functional Requirements

- [x] `/agents` displays a grid of all registered agents with token ID, users, volume, orders
- [x] `/agents/:agentTokenId` displays full agent detail with analytics, stats, orders, lending, violations, circuit breakers, policy
- [x] `/agents/my` displays the connected user's authorized agents with stats and timeline chart
- [x] "Authorize Agent" button triggers on-chain `AgentRouter.authorize()` with selected policy template
- [x] "Revoke Agent" button triggers on-chain `AgentRouter.revoke()` with confirmation
- [x] Navigation sidebar and bottom nav include "Agents" link
- [x] All pages have loading skeletons, empty states, and error handling
- [x] Transaction flow shows pending/confirming/syncing states with toast notifications

### Non-Functional Requirements

- [x] All data sections on detail page load in parallel (no waterfall)
- [x] Agent cards are responsive (1/2/3 column grid)
- [x] Pages match existing dark theme (bg-black, text-[#E0E0E0], accent #F06718)
- [x] BigInt strings are formatted to human-readable values
- [x] Route `/agents/my` does not conflict with `/agents/:agentTokenId`

## Dependencies & Risks

| Dependency | Risk | Mitigation |
|---|---|---|
| AgentRouter ABI (authorize/revoke) | ABI not in frontend codebase | Source from clob-dex repo compiled artifacts |
| Policy struct definition | Must exactly match on-chain Solidity | Verify against deployed contract |
| `/api/agents` without owner filter | May not return marketplace-style data | Confirmed in backend code — endpoint works without owner filter |
| `/api/agents/:id/analytics` | Not documented in Agent Docs.md | Confirmed endpoint exists in backend code (line 3788) |
| Indexer sync latency | UI may show stale data after tx | Use waitForIndexerSync pattern + optimistic updates |

## References & Research

### Internal References

- Brainstorm: `docs/brainstorms/2026-02-22-agents-section-brainstorm.md`
- Router pattern: `apps/web/src/router.tsx`
- Page pattern: `apps/web/src/pages/lending.tsx`
- Feature pattern: `apps/web/src/features/lending/`
- Contract interaction: `apps/web/src/features/overview/hooks/useDeposit.ts`
- API fetching: `apps/web/src/hooks/fetchIndexerAPI.ts`
- Navigation: `apps/web/src/components/layout/Sidebar.tsx`, `BottomNavigation.tsx`
- Contracts config: `apps/web/src/configs/contracts.ts`

### External References

- Agent API documentation: `/Users/renaka/gtx/scalex-8004/Agent Docs.md`
- Backend API implementation: `/Users/renaka/gtx/clob-indexer/ponder/src/api/index.ts` (lines 2789-3889)
- ERC-8004 contracts: AgentRouter at `0xE9c1a6665364294194aa3B1CE89654926b338493`
