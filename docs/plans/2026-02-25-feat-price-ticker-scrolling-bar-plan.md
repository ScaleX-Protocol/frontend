---
title: "feat: Add Scrolling Price Ticker Bar"
type: feat
status: completed
date: 2026-02-25
brainstorm: docs/brainstorms/2026-02-25-price-ticker-brainstorm.md
---

# feat: Add Scrolling Price Ticker Bar

## Overview

Add a horizontally scrolling ticker bar that displays live prices and 24h change for all available trading pairs. The bar appears on all pages, just below the main header, and clicking any item opens a detail popup with 24h high, low, and volume stats.

---

## Problem Statement / Motivation

Users currently have no at-a-glance view of the broader market while navigating the platform. Adding a price ticker bar — a staple of trading UIs — gives users continuous market awareness without requiring them to navigate to the trade page. It reinforces the platform's real-time trading identity.

---

## Proposed Solution

A `TickerBar` component embedded inside `AppHeader` (after the `<header>` element), so it automatically appears on every page without touching individual page files. It uses:

- **REST polling** (`/ticker/24hr` all pairs, every 30s) via React Query
- **Pure CSS `@keyframes`** for smooth, GPU-accelerated infinite scroll
- **Duplicate list rendering** (2× items) for a seamless loop
- **Pause on hover** via `animation-play-state: paused`
- **`TickerPopup`** (click-outside-dismissable) showing 24h high/low/volume

---

## Technical Approach

### Architecture

```
AppHeader (apps/web/src/components/appHeader.tsx)
└── <header>...</header>           ← existing
└── <TickerBar />                  ← NEW (inserted after header element)

TickerBar (apps/web/src/components/layout/TickerBar.tsx)
├── useTickerAll hook              ← NEW (React Query, 30s poll)
├── [items, items] (duplicated)    ← for seamless loop
└── TickerItem (inline/co-located)
    ├── symbol: "BTC/USDT"
    ├── price: formatPrice(lastPrice)
    ├── change: ▲/▼ + priceChangePercent (green/red)
    └── onClick → open TickerPopup with item data

TickerPopup (co-located in TickerBar.tsx)
├── symbol + current price
├── 24h High / 24h Low / 24h Volume
├── Click-outside → close (e.target === e.currentTarget pattern)
└── Escape key → close
```

### Files to Create

| File | Purpose |
|---|---|
| `apps/web/src/components/layout/TickerBar.tsx` | Main ticker component + popup |
| `apps/web/src/hooks/useTickerAll.ts` | React Query hook for all pairs |

### Files to Modify

| File | Change |
|---|---|
| `apps/web/src/components/appHeader.tsx` | Add `<TickerBar />` after `<header>` element |
| `apps/web/src/globals.css` | Add `@keyframes ticker-scroll` + `.animate-ticker-scroll` |

### Data Hook: `useTickerAll`

```typescript
// apps/web/src/hooks/useTickerAll.ts
import { useQuery } from '@tanstack/react-query';
import { fetchIndexerAPI } from '@/hooks/fetchIndexerAPI';
import type { Ticker24hr } from '@/features/trade/types/chart.types';

export function useTickerAll() {
  return useQuery<Ticker24hr[]>({
    queryKey: ['tickerAll'],
    queryFn: () => fetchIndexerAPI<Ticker24hr[]>('/ticker/24hr'),
    refetchInterval: 30_000,
    refetchIntervalInBackground: true,
    staleTime: 0,
    structuralSharing: false,
  });
}
```

> ⚠️ **Open question:** Does `/ticker/24hr` (without `?symbol=`) return all pairs as an array? This needs
> to be verified against the API. If it only accepts a single symbol, we may need `/ticker/24hr/all`
> or a different endpoint. Check `apps/web/src/configs/endpoints.ts` and the indexer API.

### CSS Animation

```css
/* Add to apps/web/src/globals.css — section 7: ANIMATIONS */
@keyframes ticker-scroll {
  0%   { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

.animate-ticker-scroll {
  animation: ticker-scroll 40s linear infinite;
}

.animate-ticker-scroll:hover {
  animation-play-state: paused;
}
```

- `translateX(-50%)` scrolls exactly one full copy (since list is duplicated = 200% total width)
- Speed `40s` is a starting point; adjust based on item count
- Hover pause via CSS only — no JS needed

### TickerBar Layout

```tsx
// apps/web/src/components/layout/TickerBar.tsx (pseudo-code)
export function TickerBar() {
  const { data: tickers, isLoading } = useTickerAll();
  const [popup, setPopup] = useState<Ticker24hr | null>(null);

  if (isLoading || !tickers?.length) return <TickerBarSkeleton />;

  return (
    <div className="w-full overflow-hidden border-b border-[#1F1F1F] bg-[#000000] h-8">
      {/* Scrolling track — duplicated for seamless loop */}
      <div className="flex animate-ticker-scroll whitespace-nowrap">
        {[...tickers, ...tickers].map((ticker, i) => (
          <TickerItem key={`${ticker.symbol}-${i}`} ticker={ticker} onClick={setPopup} />
        ))}
      </div>

      {/* Popup */}
      {popup && <TickerPopup ticker={popup} onClose={() => setPopup(null)} />}
    </div>
  );
}
```

### TickerItem Display

Each item renders as: `BTC/USDT  $65,432.00  ▲ 2.14%` with a separator dot or `|` between items.

- Price: `formatPrice(ticker.lastPrice)` from `@/core/utils`
- Change positive → `text-green-400`, negative → `text-red-400`
- Separator: a `·` or `|` element between items for visual spacing

### TickerPopup Pattern

Follows the `marketSelectorModal.tsx` click-outside pattern (simpler than full `ModalWrapper`):

```tsx
// Click-outside close: e.target === e.currentTarget on fixed backdrop
function TickerPopup({ ticker, onClose }) {
  // Escape key handler
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="absolute bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 ...">
        <p>{ticker.symbol}</p>
        <p>Price: {formatPrice(ticker.lastPrice)}</p>
        <p>24h High: {formatPrice(ticker.highPrice)}</p>
        <p>24h Low: {formatPrice(ticker.lowPrice)}</p>
        <p>Volume: {formatPrice(ticker.volume, 'USD', { compact: true })}</p>
      </div>
    </div>
  );
}
```

---

## System-Wide Impact

- **`appHeader.tsx`**: Minimal change — one import + one JSX line added after `<header>`. No props changes needed.
- **Layout shift**: `TickerBar` is ~32px tall. Pages with `h-screen` flex layout (trade page) may need `overflow: hidden` on the parent or `flex-shrink-0` on AppHeader to avoid layout compression. Verify on trade page.
- **Performance**: One polling query for all pages (React Query deduplication means multiple components mounting AppHeader won't create duplicate requests — `queryKey: ['tickerAll']` is shared).
- **Mobile**: TickerBar should be visible on mobile too (it's a summary, not a navigation element). Consider reducing font size or hiding on very small screens if too cramped.
- **Error state**: If `/ticker/24hr` fails, show nothing (hide the bar gracefully) rather than an error UI.

---

## Acceptance Criteria

- [x] Ticker bar appears on all pages, directly below the main navigation header
- [x] All available trading pairs from `/ticker/24hr` are shown
- [x] Each item shows: symbol, current price (formatted), and 24h change % with ▲/▼
- [x] Positive change is green (`#4ADE80`), negative is red (`#F87171`); ▲/▼ glyphs also indicate direction (not color alone)
- [x] The bar scrolls continuously and loops seamlessly (duplicated list, `translateX(-50%)`)
- [x] Scrolling pauses when the user hovers over the ticker (CSS `:hover { animation-play-state: paused }`)
- [x] Scrolling pauses when any popup is open
- [x] Clicking any ticker item opens **one popup at a time** with 24h high, low, volume stats (reuses already-fetched data — no second network request)
- [x] Popup is positioned below the ticker bar at a fixed location; does not anchor to the scrolling item
- [x] Popup closes when clicking outside it or pressing Escape
- [x] Only one popup can be open at a time
- [x] Data refreshes every 30 seconds automatically (`refetchIntervalInBackground: true`)
- [x] On initial load: shimmer skeleton shown
- [x] On error or empty response: bar is hidden (renders `null`)
- [x] On subsequent poll failure: last known data is retained
- [x] `prefers-reduced-motion`: animation is disabled; first N items shown statically
- [x] Layout is not broken on mobile or desktop
- [x] Popup z-index uses `var(--z-popover)` (1060) to render above page content

---

## Edge Cases & States

| State | Behavior |
|---|---|
| **Loading (initial fetch)** | Show a shimmer skeleton row using `.skeleton-shimmer` matching bar height (~32px) |
| **API error** | Hide the bar entirely — `return null` — log silently. Do not show an error message on every page. |
| **Empty array** | Hide the bar (same as error) to avoid a blank layout space |
| **Poll fails mid-session** | Keep showing last known data; React Query retains previous data by default |
| **1–2 pairs only** | Duplicate items more aggressively so the scroll doesn't look sparse |
| **Animation reset on 30s poll** | Wrap items in a stable `key`-less container so React does not unmount/remount the animated div on data updates — update data via ref or keep items stable |
| **Popup open during poll refresh** | Popup reuses data from parent state; when parent updates, popup shows fresh data passively |
| **Route change with popup open** | Popup state lives in `TickerBar` (persistent across routes) → auto-closes when user navigates since `setPopup(null)` can be triggered via router listener, OR simply accept that popup persists briefly (low impact) |
| **`prefers-reduced-motion`** | Disable animation entirely; render as a non-scrolling, overflow-hidden row showing first N items |
| **Touch / mobile** | No hover → animation never pauses on touch. Acceptable; tap to open popup still works. |

## Dependencies & Risks

| Item | Notes |
|---|---|
| `/ticker/24hr` all-pairs endpoint | **Must verify** this endpoint returns all pairs without a symbol param. May need indexer API team input. Fallback: fetch `/pairs` then fan-out per-symbol (expensive). |
| 32px height budget | Pages using `h-screen` on parent will need layout adjustment so the ticker doesn't compress content |
| Animation reset on data refresh | Must ensure the animated div is not remounted on React re-render when new poll data arrives |
| Popup anchor position | Fixed position below the ticker bar (not anchored to scrolling item) since `transform`-based animations shift DOM positions |
| Popup z-index | Use `var(--z-popover)` (1060 per globals.css) to ensure it renders above all page content |
| Tailwind v4 | `@keyframes` in globals.css works fine with v4's `@import "tailwindcss"` (confirmed by existing patterns) |

---

## References

### Internal
- `AppHeader` component: `apps/web/src/components/appHeader.tsx:69`
- `AppLayout` structure: `apps/web/src/components/layout/AppLayout.tsx:11`
- `useTicker24hr` hook (canonical example): `apps/web/src/features/trade/hooks/chart/useTicker24hr.ts`
- `Ticker24hr` type: `apps/web/src/features/trade/types/chart.types.ts:36`
- `fetchIndexerAPI`: `apps/web/src/hooks/fetchIndexerAPI.ts`
- `formatPrice`: `apps/web/src/core/utils/format.ts:79`
- Click-outside popup pattern: `apps/web/src/features/trade/components/marketSelector/marketSelectorModal.tsx:46`
- Existing keyframe animations: `apps/web/src/globals.css:527`
- Trade page layout: `apps/web/src/pages/trade.tsx:16`
