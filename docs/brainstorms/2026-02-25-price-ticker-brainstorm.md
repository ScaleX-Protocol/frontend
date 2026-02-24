# Price Ticker Brainstorm

**Date:** 2026-02-25
**Status:** Draft
**Feature:** Scrolling price ticker bar showing all trading pair prices with up/down indicators

---

## What We're Building

A horizontally scrolling ticker bar placed **below the header**, visible on all pages. It continuously scrolls all available trading pairs (fetched from `/ticker/24hr`) showing each asset's current price and 24h price change direction (▲ green / ▼ red). Clicking a ticker item opens a **small popup** with more detail (24h high, low, volume).

---

## Why This Approach

### Animation: Pure CSS Keyframes
Use a `@keyframes` translateX animation to scroll duplicated ticker items infinitely. This is:
- **Zero new dependencies** — fits the existing Tailwind-first pattern
- **GPU-accelerated** — smooth even with many items
- **Easy to pause on hover** — `animation-play-state: paused`
- Seamless loop by duplicating the item list twice in the DOM

### Data: Periodic Polling (REST)
Fetch all pairs from `/ticker/24hr` on mount and refresh every **30 seconds** via React Query. This avoids opening many WebSocket subscriptions for every pair (which would be wasteful for a summary bar) while still keeping data reasonably fresh.

### Placement: Below Header
The ticker sits in `AppLayout.tsx` just below the `appHeader` component, above the main content area. It spans the full width (accounting for the 256px sidebar offset on desktop).

---

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Placement | Below header, all pages | Maximum visibility without disrupting page-specific layouts |
| Asset list | All pairs from API | Dynamic, no hardcoding, reflects actual market |
| Animation | Pure CSS `@keyframes` | No dependencies, GPU-accelerated, Tailwind-compatible |
| Data freshness | Poll every 30s | Avoids WebSocket overhead for a summary display |
| Click behavior | Popup with 24h stats | More detail without navigating away |
| Up/Down indicator | ▲/▼ with green/red color | Universal trading UI convention |

---

## Component Plan

```
TickerBar (new)
├── Fetches all pairs via React Query (30s refetch)
├── Renders two copies of TickerList for seamless loop
└── TickerItem
    ├── Symbol (e.g. "BTC/USDT")
    ├── Price (formatted via existing formatPrice util)
    ├── Change % with ▲/▼ and green/red color
    └── onClick → TickerPopup

TickerPopup (new)
├── 24h High / Low / Volume
└── Close on click-outside
```

**Integration point:** `apps/web/src/app/AppLayout.tsx` — add `<TickerBar />` between header and main content.

**Data hook:** Reuse existing `fetchAPI('/ticker/24hr')` pattern from `useTicker`.

---

## Open Questions

_None — all key questions resolved during brainstorm._

---

## Resolved Questions

- **Placement:** Below header ✓
- **Assets:** All pairs from `/ticker/24hr` ✓
- **Updates:** Poll every 30s ✓
- **Click behavior:** Popup with 24h stats ✓
- **Animation:** Pure CSS keyframes ✓
