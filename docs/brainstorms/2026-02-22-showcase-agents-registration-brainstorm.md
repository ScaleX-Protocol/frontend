---
title: "Register 8 Showcase Agents with On-Chain Metadata"
type: feat
status: active
date: 2026-02-22
---

# Register 8 Showcase Agents with On-Chain Metadata

## What We're Building

Register 8 distinct AI trading agents on Base Sepolia to populate the `/agents` marketplace. Each agent gets:
- **On-chain NFT** via IdentityRegistry (`register()`)
- **Metadata URI** pointing to R2-hosted JSON (name, description, image)
- **AI-generated avatar images** uploaded to Cloudflare R2
- **Frontend update** to fetch and display tokenURI metadata on agent cards/detail pages

## Why This Approach

- On-chain tokenURI is the standard ERC-721 metadata pattern — any NFT explorer or frontend can read it
- R2 is fast, cheap, and the user already has a Cloudflare account
- AI-generated images give each agent a unique visual identity
- Registration via the existing `agent0-sdk` + `register.ts` script keeps it simple

## The 8 Agents

| # | Name | Description | Risk Level |
|---|------|-------------|------------|
| 0 | ScaleX DCA Bot | (existing) Periodic market buys on a schedule. Set-and-forget dollar-cost averaging. | Low |
| 1 | Smart Money Tracker | Monitors whale wallet activity and mirrors their trades with configurable delay and size limits. | Medium |
| 2 | Social Sentiment Bot | Analyzes X/Twitter trending tokens and executes trades based on social momentum signals. | High |
| 3 | Dip Buyer | Places limit buy orders at configurable percentages below current market price. Catches pullbacks automatically. | Low |
| 4 | Lending Optimizer | Auto-supplies idle tokens to lending pools for yield. Monitors health factors and rebalances. | Low |
| 5 | Range Trader | Places buy orders at support and sell orders at resistance within a defined price range. | Medium |
| 6 | Stop-Loss Guardian | Monitors open positions and executes market sells when price drops below configurable thresholds. | Low |
| 7 | Alpha Scanner | Aggregates signals from CT influencers and on-chain data to identify early trading opportunities. | High |

## Key Decisions

1. **Metadata hosting**: Cloudflare R2 bucket with public access — fast, cheap, user already has Cloudflare account
2. **Image generation**: AI-generated robot/bot avatars — each agent gets a unique, distinctive icon
3. **Registration method**: Reuse existing `register.ts` script with `agent0-sdk` — already handles mint + IPFS/URI flow
4. **Agent #0 update**: Call `setAgentURI(0, ...)` to add metadata to the already-registered agent
5. **Frontend changes**: Fetch tokenURI on-chain → parse JSON → display name, description, image on cards and detail page
6. **Metadata format**: Standard ERC-721 JSON — `{ name, description, image, attributes }`

## Registration Flow

### For existing Agent #0:
1. Upload metadata JSON + image to R2
2. Call `setAgentURI(0, "https://r2-url/agents/0/metadata.json")` via cast

### For new Agents #1-7:
1. Generate AI avatar images (8 total including #0's)
2. Upload all images to R2
3. Create metadata JSON files per agent
4. Upload JSON files to R2
5. Run `register.ts` script 7 times with different AGENT_NAME/DESCRIPTION/IMAGE env vars
6. Each registration mints NFT + sets tokenURI in one transaction

### Frontend:
1. Add `useAgentMetadata(agentTokenId)` hook — calls `tokenURI(id)` on IdentityRegistry, fetches JSON
2. Update `AgentCard.tsx` to show name, description, image from metadata
3. Update `AgentDetail.tsx` header to show name, description, image
4. Fallback: if tokenURI is empty, show "Agent #N" with generic icon (current behavior)

## R2 Bucket Structure

```
scalex-agents/
├── 0/
│   ├── metadata.json
│   └── avatar.png
├── 1/
│   ├── metadata.json
│   └── avatar.png
├── ...
└── 7/
    ├── metadata.json
    └── avatar.png
```

## Metadata JSON Format

```json
{
  "name": "ScaleX DCA Bot",
  "description": "Periodic market buys on a schedule. Set-and-forget dollar-cost averaging.",
  "image": "https://<r2-public-url>/agents/0/avatar.png",
  "attributes": [
    { "trait_type": "Risk Level", "value": "Low" },
    { "trait_type": "Strategy", "value": "DCA" },
    { "trait_type": "Category", "value": "Trading" }
  ]
}
```

## Contract References

- **IdentityRegistry**: `0xC2A65565d9E4D901B80a38872688B23B2F8d0975` (Base Sepolia)
- `tokenURI(uint256) → string` — read metadata URI
- `setAgentURI(uint256, string)` — update URI (owner only)
- `register(string agentURI)` — mint + set URI in one call
- Existing script: `src/register.ts` using `agent0-sdk`

## Open Questions

None — all key decisions resolved during brainstorm.
