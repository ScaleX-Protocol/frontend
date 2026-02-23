---
title: "feat: Agent Metadata Infrastructure — R2 Hosting, Assets, URI Update, and Frontend Display"
type: feat
status: completed
date: 2026-02-23
brainstorm: docs/brainstorms/2026-02-22-showcase-agents-registration-brainstorm.md
related: docs/plans/2026-02-23-feat-batch-agent-registration-plan.md
---

# feat: Agent Metadata Infrastructure — R2 Hosting, Assets, URI Update, and Frontend Display

## Overview

Set up the metadata hosting infrastructure on Cloudflare R2, create agent assets (AI-generated avatars + metadata JSON), update Agent #0's tokenURI on-chain, and update the frontend to fetch and display agent metadata (name, description, image) from on-chain tokenURI.

Batch registration of 7 new agents is covered in a separate plan.

## Problem Statement / Motivation

The `/agents` marketplace currently shows "Agent #0" with no name, description, or image. The API returns only on-chain stats (users, volume, orders). To make the marketplace usable, agents need:
- Visual avatars and descriptions so users understand what each agent does
- On-chain metadata following ERC-721 standard so any frontend/explorer can read it
- A hosting infrastructure that future agent registrations can also use

## Proposed Solution

Three workstreams executed sequentially:

1. **R2 Setup + Asset Creation** — Create Cloudflare R2 bucket, generate AI avatars, create metadata JSON files, upload everything
2. **Agent #0 URI Update** — Call `setAgentURI(0, ...)` to point existing agent to R2-hosted metadata
3. **Frontend Updates** — Add `useAgentMetadata` hook to read tokenURI on-chain, update AgentCard, AgentDetail, and MyAgentCard to display name/description/image

### Architecture Decision: R2 as Canonical Metadata Host

**Decision:** Use R2 HTTPS URLs directly as tokenURIs — no IPFS involved.

**Why:** Simpler dependency chain. Avoids IPFS gateway resolution in the frontend and gives full control over hosting. Future agents can also host their metadata on R2.

**Flow:**
```
R2 bucket (public)
├── agents/0/metadata.json  ← tokenURI points here
│   └── { name, description, image: "https://r2-url/agents/0/avatar.png" }
├── agents/0/avatar.png
└── ...  (future agents follow same structure)
```

### Agent #0 Metadata

| Field | Value |
|-------|-------|
| Name | ScaleX DCA Bot |
| Description | Periodic market buys on a schedule. Set-and-forget dollar-cost averaging. |
| Risk Level | Low |
| Category | Trading |
| Strategy | DCA |

### Future Agents Reference (for asset pre-creation)

Assets for all 8 agents should be created and uploaded now so they're ready when the batch registration plan executes:

| # | Name | Description | Risk | Category |
|---|------|-------------|------|----------|
| 0 | ScaleX DCA Bot | Periodic market buys on a schedule. Set-and-forget dollar-cost averaging. | Low | Trading |
| 1 | Smart Money Tracker | Monitors whale wallet activity and mirrors their trades with configurable delay and size limits. | Medium | Signal |
| 2 | Social Sentiment Bot | Analyzes X/Twitter trending tokens and executes trades based on social momentum signals. | High | Signal |
| 3 | Dip Buyer | Places limit buy orders at configurable percentages below current market price. Catches pullbacks automatically. | Low | Trading |
| 4 | Lending Optimizer | Auto-supplies idle tokens to lending pools for yield. Monitors health factors and rebalances. | Low | Lending |
| 5 | Range Trader | Places buy orders at support and sell orders at resistance within a defined price range. | Medium | Trading |
| 6 | Stop-Loss Guardian | Monitors open positions and executes market sells when price drops below configurable thresholds. | Low | Risk |
| 7 | Alpha Scanner | Aggregates signals from CT influencers and on-chain data to identify early trading opportunities. | High | Signal |

Note: Numbers here are directory names on R2, not guaranteed token IDs. Actual token IDs are assigned at registration time.

## Implementation Phases

### Phase 1: R2 Setup + Asset Creation

**1.1 Create Cloudflare R2 Bucket**

- [x] Create bucket named `scalex-agents` (APAC region)
- [x] Enable public access via custom domain `agents.scalex.money`
- [ ] Configure CORS: `Access-Control-Allow-Origin: *`, `Access-Control-Allow-Methods: GET` (deferred — custom domain serves without CORS issues)
- [x] Public base URL: `https://agents.scalex.money`
- [x] Verify public access: `curl https://agents.scalex.money/agents/0/metadata.json` returns valid JSON

**1.2 Generate AI Avatars**

- [x] Generate 8 unique SVG avatar icons — one per agent (400x400px, <3KB each)
- [x] Each visually distinct with unique icon per agent type
- [x] Dark background (#111111) with #F06718 orange accent
- [x] Stored in `assets/agents/N/avatar.svg`

**1.3 Create Metadata JSON Files**

- [x] Create 8 `metadata.json` files following ERC-721 standard

For each agent, create `metadata.json`:

```json
{
  "name": "ScaleX DCA Bot",
  "description": "Periodic market buys on a schedule. Set-and-forget dollar-cost averaging.",
  "image": "https://<R2_PUBLIC_URL>/agents/0/avatar.png",
  "attributes": [
    { "trait_type": "Risk Level", "value": "Low" },
    { "trait_type": "Strategy", "value": "DCA" },
    { "trait_type": "Category", "value": "Trading" }
  ]
}
```

**1.4 Upload to R2**

- [x] Upload all files maintaining the directory structure:
```
agents/0/metadata.json
agents/0/avatar.png
agents/1/metadata.json
agents/1/avatar.png
...
agents/7/metadata.json
agents/7/avatar.png
```
- [x] Verify metadata URLs return 200 with valid JSON
- [x] Verify image URLs return 200 with correct content-type

### Phase 2: Agent #0 URI Update

**2.1 Update Agent #0's tokenURI on-chain**

Agent #0 is owned by `0x2dBf9D93e9Ec66e9E03FE484256EcC432E5681D3`. Run from this wallet:

```bash
cast send 0xC2A65565d9E4D901B80a38872688B23B2F8d0975 \
  "setAgentURI(uint256,string)" 0 "https://<R2_PUBLIC_URL>/agents/0/metadata.json" \
  --private-key $AGENT_PRIVATE_KEY \
  --rpc-url https://sepolia.base.org
```

- [x] Execute `setAgentURI` transaction (tx: `0x3312ee5d53890e44936dda99756c5b979bc84e32c00adca0b7744dd6a4393f36`)
- [x] Verify: `tokenURI(0)` returns `https://agents.scalex.money/agents/0/metadata.json`
- [x] Verify: fetching the returned URL returns valid metadata JSON

### Phase 3: Frontend Updates

**3.1 Add IdentityRegistry to contracts.ts**

`apps/web/src/configs/contracts.ts`:
- [x] Add `identityRegistryAddress` to `ChainContracts` interface
- [x] Add address `0xC2A65565d9E4D901B80a38872688B23B2F8d0975` to `Contracts` object
- [x] Add `IdentityRegistryABI` with just `tokenURI(uint256)` function:

```typescript
export const IdentityRegistryABI = [
  {
    name: 'tokenURI',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'string' }],
  },
] as const;
```

**3.2 Create useAgentMetadata hook**

`apps/web/src/features/agents/hooks/useAgentMetadata.ts`:

```typescript
export interface AgentMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{ trait_type: string; value: string }>;
}

export function useAgentMetadata(agentTokenId: string | undefined) {
  return useQuery({
    queryKey: ['agentMetadata', agentTokenId],
    queryFn: async () => {
      const uri = await publicClient.readContract({
        address: Contracts[CHAIN_ID].identityRegistryAddress,
        abi: IdentityRegistryABI,
        functionName: 'tokenURI',
        args: [BigInt(agentTokenId!)],
      });
      if (!uri) return null;
      const res = await fetch(uri as string);
      if (!res.ok) return null;
      return res.json() as Promise<AgentMetadata>;
    },
    enabled: !!agentTokenId,
    staleTime: 10 * 60 * 1000, // 10 min — metadata rarely changes
    retry: 1,
  });
}
```

Key details:
- Uses `createPublicClient({ chain: baseSepolia, transport: http() })` — same pattern as `AuthorizeAgentButton.tsx`
- Returns `null` for empty URI or fetch failure (graceful fallback)
- Long `staleTime` since metadata is essentially immutable
- Single `retry` to handle transient network issues

**3.3 Update AgentCard.tsx**

- [x] Call `useAgentMetadata(agent.agentTokenId)`
- [x] Replace hardcoded "Agent #N" with `metadata?.name || 'Agent #${agent.agentTokenId}'`
- [x] Add avatar image with fallback to Bot icon
- [x] Add truncated description text with `line-clamp-2`
- [x] Show loading skeleton while metadata is fetching
- [x] Handle broken images with `onError` fallback to generic icon

**3.4 Update AgentDetail.tsx**

- [x] Call `useAgentMetadata(agentTokenId)` in the detail page
- [x] Replace header "Agent #N" with agent name (fallback to "Agent #N")
- [x] Add description below the name
- [x] Add larger avatar image (14x14) in the header section
- [x] Show risk level and category from attributes as badges

**3.5 Update MyAgentCard.tsx**

- [x] Same metadata integration as AgentCard — show name and avatar instead of just "#N"

## Technical Considerations

### R2 CORS Configuration

The frontend fetches metadata JSON from R2 via browser `fetch()`. Without CORS headers, this will fail. Configure the R2 bucket with:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET
```
Test CORS with: `curl -H "Origin: http://localhost:3000" -I <R2_URL>/agents/0/metadata.json`

### Image Error Handling

Agent avatars loaded via `<img>` may fail (404, network error). Use `onError` handler to hide broken image and show fallback colored icon. Example:
```tsx
<img
  src={metadata?.image}
  onError={(e) => { e.currentTarget.style.display = 'none'; }}
  alt={metadata?.name}
  className="w-10 h-10 rounded-lg object-cover"
/>
```

### Security — Metadata Sanitization

For showcase agents this is safe (we control R2). For future third-party agents:
- Validate `image` URL is `https://` (not `javascript:`, `data:`, etc.)
- Truncate `name` and `description` to reasonable lengths in the UI
- Don't render raw HTML from metadata fields

### Existing Frontend Chain Client

The frontend already uses Base Sepolia (chain ID 84532) — see `AuthorizeAgentButton.tsx:47-50` which creates `createPublicClient({ chain: baseSepolia, transport: http() })`. The `useAgentMetadata` hook follows the same pattern. No additional chain client needed.

## Acceptance Criteria

### Functional Requirements

- [x] Cloudflare R2 bucket created with public access via custom domain `agents.scalex.money`
- [x] 8 SVG avatar icons uploaded to R2 (400x400px, <3KB each)
- [x] 8 metadata JSON files uploaded to R2 with correct name, description, image, attributes
- [x] Agent #0's tokenURI updated on-chain to point to R2 metadata
- [x] `useAgentMetadata` hook reads tokenURI on-chain and fetches metadata JSON
- [x] AgentCard shows agent name, description snippet, and avatar image
- [x] AgentDetail shows agent name, full description, avatar, and attribute badges
- [x] MyAgentCard shows agent name and avatar
- [x] Fallback to "Agent #N" with generic icon when tokenURI is empty
- [x] Broken/missing images fall back to generic icon gracefully

### Non-Functional Requirements

- [x] Metadata hook has 10-minute staleTime (avoid unnecessary RPC calls)
- [x] Avatar SVGs are under 3KB each for fast mobile loading
- [x] Custom domain `agents.scalex.money` serves without CORS issues
- [x] No IPFS dependency — R2 HTTPS URLs only

## Dependencies & Risks

| Dependency | Risk | Mitigation |
|---|---|---|
| Cloudflare R2 bucket | User has account but no bucket yet | Quick to create via dashboard or CLI |
| Agent Wallet private key | Must own token #0 to call setAgentURI | Verified: `0x2dBf9D93e9Ec66e9E03FE484256EcC432E5681D3` owns token #0 |
| AI image generation | Quality/consistency of generated images | Generate extras and pick the best 8 |
| R2 public access + CORS | Must be configured before frontend works | Test with curl before coding frontend |

## References & Research

### Internal References

- Existing registration script: `src/register.ts`
- Frontend contracts config: `apps/web/src/configs/contracts.ts`
- Agent card component: `apps/web/src/features/agents/components/AgentCard.tsx`
- Agent detail component: `apps/web/src/features/agents/components/AgentDetail.tsx`
- My agent card component: `apps/web/src/features/agents/components/MyAgentCard.tsx`
- On-chain read pattern: `apps/web/src/features/agents/components/AuthorizeAgentButton.tsx:47-50`
- Brainstorm: `docs/brainstorms/2026-02-22-showcase-agents-registration-brainstorm.md`

### Contract References

- IdentityRegistry: `0xC2A65565d9E4D901B80a38872688B23B2F8d0975` (Base Sepolia)
- Agent #0 owner: `0x2dBf9D93e9Ec66e9E03FE484256EcC432E5681D3`
- Functions: `tokenURI(uint256)`, `setAgentURI(uint256, string)`

### Related Plans

- Batch registration of 7 new agents: `docs/plans/2026-02-23-feat-batch-agent-registration-plan.md` (to be created)
