---
title: "feat: Collapsible Sidebar with Icon-Only Rail"
type: feat
status: completed
date: 2026-02-25
brainstorm: docs/brainstorms/2026-02-25-collapsible-sidebar-brainstorm.md
---

# feat: Collapsible Sidebar with Icon-Only Rail

## Overview

Add a toggle to the sidebar that collapses it from a full 256px navigation panel to a compact 64px icon-only rail. The user's preference persists in `localStorage`. All nav items remain accessible in collapsed state via icons; labels are hidden and shown as tooltips on hover.

---

## Proposed Solution

Three files change; one new file is created:

| File | Action |
|------|--------|
| `providers/SidebarContext.tsx` | **Create** — boolean state + toggle + localStorage persistence |
| `components/layout/Sidebar.tsx` | **Modify** — consume context, add chevron toggle, hide labels/help card when collapsed |
| `components/layout/AppLayout.tsx` | **Modify** — consume context, animate main content margin |
| `components/ui/tooltip.tsx` | **Modify** — add `side` prop to support right-side positioning for nav items |

The `SidebarProvider` is mounted inside `AppLayout.tsx` itself (not in the global `Providers` chain) since sidebar state is purely a layout concern.

---

## Technical Considerations

- **Dynamic width**: Tailwind cannot interpolate arbitrary values at runtime (`md:ml-[${n}px]` won't work). Use Framer Motion's `animate={{ width }}` / `animate={{ marginLeft }}` instead — already used in `sheet.tsx` and `AgentChatPanel.tsx`.
- **Spring config**: Match the existing spring from `sheet.tsx`: `{ type: 'spring', damping: 25, stiffness: 200 }`.
- **Tooltip positioning**: The existing `tooltip.tsx` positions `bottom-full` (above). Nav items on the left rail need `left-full` (to the right). Add an optional `side` prop defaulting to `'top'`.
- **No SSR concern**: This is a Vite SPA — `localStorage` access in `useState` lazy initializer is safe.
- **`overflow-hidden` on sidebar**: Needed to clip text labels as width animates, preventing text overflow during transition.

---

## Acceptance Criteria

- [x] Sidebar collapses to ~64px icon-only rail when chevron is clicked
- [x] Sidebar expands back to 256px when chevron is clicked again
- [x] In collapsed state: logo icon visible, "ScaleX" text hidden
- [x] In collapsed state: nav icons visible, nav labels hidden
- [x] In collapsed state: "Need Help?" card hidden, Settings icon-only
- [x] Hovering a nav icon in collapsed state shows a tooltip to the right with the label
- [x] Main content area shifts margin to match sidebar width (no layout overlap)
- [x] Width and margin animate smoothly (spring transition)
- [x] State persists in `localStorage` key `gtx-sidebar-collapsed` across page reloads
- [x] Mobile behavior unchanged (sidebar hidden on mobile, no collapse toggle visible)

---

## Implementation Steps

### Step 1 — Create `SidebarContext.tsx`

**File**: `apps/web/src/providers/SidebarContext.tsx`

Follow the `ChainTypeContext.tsx` pattern exactly:

```tsx
// apps/web/src/providers/SidebarContext.tsx
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

interface SidebarContextValue {
  isCollapsed: boolean;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem('gtx-sidebar-collapsed');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('gtx-sidebar-collapsed', JSON.stringify(next));
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ isCollapsed, toggleCollapsed }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) throw new Error('useSidebar must be used within a SidebarProvider');
  return context;
}
```

---

### Step 2 — Update `tooltip.tsx` to support `side` prop

**File**: `apps/web/src/components/ui/tooltip.tsx`

Add an optional `side?: 'top' | 'right'` prop. When `side === 'right'`, position the tooltip to the right of the trigger instead of above.

```tsx
// Add side prop to TooltipProps:
interface TooltipProps {
  content: string;
  children: React.ReactNode;
  side?: 'top' | 'right';  // default: 'top'
}

// Conditional positioning:
// side === 'right':
//   className: "absolute z-50 left-full top-1/2 -translate-y-1/2 ml-2 px-3 py-2 ..."
//   arrow: pointing left
// side === 'top' (existing behavior):
//   className: "absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 ..."
//   arrow: pointing down (existing)
```

---

### Step 3 — Update `Sidebar.tsx`

**File**: `apps/web/src/components/layout/Sidebar.tsx`

Key changes:
1. Convert `<aside>` to `<motion.aside>` with `animate={{ width: isCollapsed ? 64 : 256 }}`
2. Add `overflow-hidden` to `<motion.aside>`
3. Add chevron toggle button in the logo row
4. Wrap logo text and nav labels with conditional rendering
5. Hide "Need Help?" card and Settings label when collapsed
6. Wrap each nav item in `<Tooltip content={item.label} side="right">` (only active when collapsed)

```tsx
// Sketch of updated aside:
<motion.aside
  animate={{ width: isCollapsed ? 64 : 256 }}
  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
  className="fixed left-0 top-0 h-screen bg-[#000000] border-r border-[#1F1F1F] flex flex-col z-50 overflow-hidden"
>
  {/* Logo row */}
  <div className="p-6 h-[64px] flex items-center justify-between">
    <Link to="/" className="flex items-center gap-2 group">
      <img src="/images/logo/ScaleX.webp" ... />
      {!isCollapsed && <span className="font-bold text-lg text-[#E0E0E0]">ScaleX</span>}
    </Link>
    <button onClick={toggleCollapsed} className="text-[#606060] hover:text-[#A0A0A0] transition-colors">
      {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
    </button>
  </div>

  {/* Nav items */}
  <nav className="flex-1 px-3 py-6">
    <ul className="space-y-1">
      {navItems.map((item) => (
        <li key={item.path}>
          <Tooltip content={item.label} side="right">
            <Link to={item.path} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${...}`}>
              <span className={...}>{item.icon}</span>
              {!isCollapsed && <span className="font-medium text-sm">{item.label}</span>}
            </Link>
          </Tooltip>
        </li>
      ))}
    </ul>
  </nav>

  {/* Bottom section */}
  <div className="p-3 space-y-3">
    {!isCollapsed && (
      <div className="bg-linear-to-b ...">
        {/* Need Help card */}
      </div>
    )}
    <Tooltip content="Settings" side="right">
      <Link to="/overview" className="flex items-center gap-3 px-3 py-2.5 ...">
        <Settings size={20} />
        {!isCollapsed && <span className="font-medium text-sm">Settings</span>}
      </Link>
    </Tooltip>
  </div>
</motion.aside>
```

---

### Step 4 — Update `AppLayout.tsx`

**File**: `apps/web/src/components/layout/AppLayout.tsx`

1. Wrap the return with `<SidebarProvider>`
2. Convert `<main>` to `<motion.main>` with `animate={{ marginLeft: isCollapsed ? 64 : 256 }}`
3. Extract a child component `AppLayoutInner` that calls `useSidebar()` (since Provider and consumer must be in separate render scopes)

```tsx
// apps/web/src/components/layout/AppLayout.tsx
import { SidebarProvider, useSidebar } from '@/providers/SidebarContext';
import { motion } from 'framer-motion';

function AppLayoutInner() {
  const { isCollapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-[#050505]">
      <div className="hidden md:block">
        <Sidebar />
      </div>
      <motion.main
        animate={{ marginLeft: isCollapsed ? 64 : 256 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="min-h-screen pb-[70px] md:pb-0"
      >
        <Outlet />
      </motion.main>
    </div>
  );
}

export default function AppLayout() {
  return (
    <SidebarProvider>
      <AppLayoutInner />
    </SidebarProvider>
  );
}
```

> **Note**: `motion.main` will animate on mobile too where marginLeft should be 0. Guard with a `md` breakpoint or wrap the `animate` value: `marginLeft: isMobile ? 0 : (isCollapsed ? 64 : 256)`. Simplest fix: keep existing `md:` logic and only apply motion on desktop. Can use `useMediaQuery` or check `window.innerWidth >= 768`.

---

## Dependencies & Risks

| Risk | Mitigation |
|------|-----------|
| Mobile margin animation conflict | Only apply `motion.main` margin when `md` breakpoint is active; on mobile keep `marginLeft: 0` |
| Tooltip renders on top of nav icon even when expanded | Conditionally render `<Tooltip>` only when `isCollapsed` |
| Framer Motion on `motion.main` causes layout flicker on initial render | Initialize `marginLeft` correctly from localStorage before first paint via `useLayoutEffect` or `initial` prop set to current value |
| `overflow-hidden` on sidebar clips dropdown menus | No dropdown menus currently exist in sidebar |

---

## References

- Context pattern: `apps/web/src/providers/ChainTypeContext.tsx`
- Animation pattern: `apps/web/src/components/ui/sheet.tsx`
- Existing Tooltip: `apps/web/src/components/ui/tooltip.tsx`
- Sidebar: `apps/web/src/components/layout/Sidebar.tsx`
- Layout: `apps/web/src/components/layout/AppLayout.tsx`
- Providers entry: `apps/web/src/providers/privyProvider.tsx` (exports `Providers`)
- Main entry: `apps/web/src/main.tsx`
