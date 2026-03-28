# Agent Registration Dialog Improvement — Brainstorm

**Date:** 2026-03-07
**Status:** Ready for planning

---

## What We're Building

Improve the `RegisterAgentModal` to surface the ScaleX CLI as a first-class option alongside the existing example repo and SKILL.md docs. Restructure from a vertical stack to a **3-column horizontal card layout** so developers can immediately see all three paths side by side.

---

## Why This Approach

The current modal is informational-only and vertical — developers have to scroll through two cards before seeing all options. More importantly, the ScaleX CLI (`https://github.com/ScaleX-Protocol/cli`) is completely absent, leaving developers without the fastest way to start interacting with the protocol programmatically.

A 3-column layout lets developers compare paths at a glance and pick the one that fits their skill level.

---

## Key Decisions

### Layout
- **3 equal-width columns** side by side inside the modal
- Wider modal (already `max-w-4xl`, may need `max-w-5xl`)
- On mobile: stack vertically (existing responsive pattern)

### Three Cards

| Card | Icon | Title | Content |
|------|------|-------|---------|
| 1 | `Terminal` | **ScaleX CLI** | Install command snippet with copy button (`bun install` / `bun run src/index.ts --help`), link to GitHub CLI repo |
| 2 | `Code` | **Example Implementation** | Clone reference agent (existing); link + copy URL |
| 3 | `FileText` | **Build from Scratch** | SKILL.md docs (existing); link + copy URL |

### CLI Card Content
- Show install steps as a small code block:
  ```
  git clone https://github.com/ScaleX-Protocol/cli
  bun install
  bun run src/index.ts --help
  ```
- Copy-to-clipboard for the repo URL
- "View CLI Repo" link button → `https://github.com/ScaleX-Protocol/cli`

### Accent Colors
- CLI card: green (`#22C55E`) — new, primary recommended path
- Example card: orange (`#F06718`) — existing
- Build Own card: blue (`#3B82F6`) — existing

### "What you can build" section
Keep the bullet list below the cards (full width), or remove if it feels redundant.

---

## Open Questions

_None — all resolved._

---

## Resolved Questions

- **Goal**: All of the above — discoverability, developer journey clarity, CLI as primary path
- **Layout**: 3 equal columns side by side
- **CLI repo**: `https://github.com/ScaleX-Protocol/cli` (bun-based, MCP server support)

---

## Out of Scope

- Actual agent registration form / on-chain submission (separate feature)
- Wallet connection requirement to view the dialog
- Step-by-step wizard flow
