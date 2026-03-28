# Collapsible Sidebar Brainstorm

**Date:** 2026-02-25
**Status:** Ready for planning

---

## What We're Building

A collapsible sidebar that lets users toggle between a full 256px navigation panel and a compact 64px icon-only rail. The collapsed state shows only icons; labels are hidden. State persists in `localStorage` so the user's preference survives page refreshes and new sessions.

---

## Why This Approach

The **icon-only rail** approach was chosen over fully-hidden because:
- Navigation remains accessible without an extra click to re-open
- Icons are already meaningful (Overview, Trade, Lending, Agents, Faucet)
- Maximizes content area without disorienting the user
- Common pattern in trading/dashboard UIs (Binance, TradingView)

The **chevron button in the sidebar header** was chosen because:
- Natural placement alongside the logo
- Doesn't intrude on the main content layout
- Consistent with the sidebar being self-contained

**localStorage persistence** because users on a trading platform have deliberate layout preferences — collapsing to focus on charts is intentional and should be remembered.

---

## Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Collapsed appearance | Icon-only rail (~64px) | Keeps nav accessible, maximizes content |
| Toggle placement | Chevron inside sidebar header | Self-contained, clean |
| State persistence | `localStorage` | User intent should survive refresh |
| State management | React Context (`SidebarContext`) | Matches existing `ChainTypeContext` pattern |
| Animation | Framer Motion (already installed) | Smooth width transition, consistent with Sheet/AgentChatPanel |
| Icon tooltips | Show label on hover when collapsed | Preserves discoverability |

---

## Implementation Sketch

### Components affected:
- `Sidebar.tsx` — add collapse toggle, conditional rendering of labels, width transition
- `AppLayout.tsx` — update `md:ml-[256px]` to react to collapsed state (`md:ml-[64px]` when collapsed)

### New files:
- `providers/SidebarContext.tsx` — `isCollapsed` state + toggle, persisted via `localStorage`

### Behavior details:
- **Expanded**: 256px, logo + text, full nav labels, "Need Help?" card, Settings label
- **Collapsed**: 64px, logo icon only (no "ScaleX" text), icon-only nav, "Need Help?" card hidden, Settings icon only
- **Chevron**: `ChevronLeft` when expanded → `ChevronRight` when collapsed (or rotate via CSS)
- **Transition**: `transition-all duration-300` on sidebar width + `overflow-hidden` to clip labels
- **Tooltips**: Radix `Tooltip` or simple `title` attribute on nav items when collapsed

### localStorage key: `gtx-sidebar-collapsed`

---

## Open Questions

_None — all key decisions resolved._

---

## Out of Scope

- Mobile behavior (sidebar is already hidden on mobile via `md:block`)
- Hover-to-expand (keep it simple: explicit toggle only)
- Per-page sidebar state
