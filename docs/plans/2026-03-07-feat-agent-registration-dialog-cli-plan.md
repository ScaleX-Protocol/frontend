---
title: "feat: Improve Agent Registration Dialog with CLI option and horizontal layout"
type: feat
status: completed
date: 2026-03-07
---

# feat: Improve Agent Registration Dialog with CLI option and horizontal layout

## Overview

Restructure `RegisterAgentModal` from a vertical two-card stack to a **3-column horizontal grid**, and add the **ScaleX CLI** as a new first card. This surfaces the CLI (`github.com/ScaleX-Protocol/cli`) as a first-class developer path and gives developers a clear side-by-side comparison of all three starting options.

## Files to Modify

- `apps/web/src/features/agents/components/RegisterAgentModal.tsx` — only file that needs changes

## Proposed Solution

### Layout Change

Replace the current `space-y-6` vertical stack with a responsive grid:

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {/* Card 1: ScaleX CLI */}
  {/* Card 2: Example Implementation (existing) */}
  {/* Card 3: Build Your Own (existing) */}
</div>
```

Pattern reference: `DepthBreakdownModal.tsx:136` uses `grid grid-cols-2 md:grid-cols-3 gap-4`.

### New Card: ScaleX CLI

- **Icon:** `Terminal` from lucide-react
- **Accent color:** `#22C55E` (green-500) — `/10` bg, icon tinted
- **Content:** Short description + code snippet showing install steps
- **Actions:** "View CLI Repo" link button + copy-URL icon button

Install snippet (display only, not copyable as block):
```
git clone https://github.com/ScaleX-Protocol/cli
cd cli && bun install
bun run src/index.ts --help
```

Copy button copies: `https://github.com/ScaleX-Protocol/cli`

### State Changes

Add one new copy state:
```tsx
const [copiedCli, setCopiedCli] = useState(false);
const cliRepoUrl = "https://github.com/ScaleX-Protocol/cli";
```

Update `handleCopy` to accept `"cli" | "repo" | "skill"`.

### Accessibility

- Add `aria-label` to all copy icon buttons: `"Copy CLI repo URL"`, `"Copy example repo URL"`, `"Copy docs URL"`
- Clipboard failure: wrap `navigator.clipboard.writeText` in try/catch (silent fail)

### Modal Width

Change `max-w-4xl` → `max-w-5xl` to give 3 columns comfortable breathing room.

### Mobile

Grid stacks to `grid-cols-1` on mobile — cards stack vertically, same as current behavior on small screens.

## Acceptance Criteria

- [x] 3 cards render side-by-side on `md:` breakpoint and above
- [x] Cards stack vertically on mobile (< `md:`)
- [x] CLI card appears first with green accent icon
- [x] CLI card shows install snippet in a styled code block (`bg-[#0A0A0A] font-mono text-xs`)
- [x] CLI card "View CLI Repo" links to `https://github.com/ScaleX-Protocol/cli` (opens new tab)
- [x] CLI copy button copies the CLI repo URL with 2s check-icon feedback
- [x] Existing Example and Build Your Own cards are unchanged in content
- [x] All copy buttons have descriptive `aria-label`
- [x] Clipboard errors are caught silently (no unhandled promise rejection)
- [x] Modal uses `max-w-5xl`
- [x] "What you can build" bullet list and "Got it" button remain below the grid

## Implementation Notes

- Import `Terminal` from `lucide-react` (already imported in project)
- Green accent: `bg-[#22C55E]/10` for icon bg, `text-[#22C55E]` for icon
- Code block: `<pre>` or `<code>` tag, `font-mono text-xs text-[#A0A0A0] bg-[#0A0A0A] rounded-lg p-3 overflow-x-auto`
- Keep `ModalWrapper`, `isOpen`, `onClose` props unchanged

## References

- Current modal: `apps/web/src/features/agents/components/RegisterAgentModal.tsx`
- Grid pattern: `apps/web/src/features/trade/components/orderBook/DepthBreakdownModal.tsx:136`
- Card styling: `apps/web/src/features/agents/components/AgentAnalytics.tsx:15`
- Modal wrapper: `apps/web/src/components/modals/modalWrapper.tsx`
- CLI repo: `https://github.com/ScaleX-Protocol/cli`
