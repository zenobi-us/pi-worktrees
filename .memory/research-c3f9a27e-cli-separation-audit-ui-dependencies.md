---
id: c3f9a27e
title: CLI separation audit of ui and pi-coding-agent dependencies
created_at: 2026-03-23T19:25:11+10:30
updated_at: 2026-03-23T19:25:11+10:30
status: completed
epic_id: e9f4a1c2
---

# Research: CLI separation audit of UI and pi-coding-agent dependencies

## Research Questions
- Where are `ui.notify` and other interactive UI APIs used today?
- Which files are directly coupled to `@mariozechner/pi-coding-agent` types/runtime?
- What migration seam should be used for CLI-only decoupling?

## Summary
The codebase is mostly service-oriented already, but command entrypoints remain directly coupled to `ExtensionCommandContext` and `ctx.ui.*`. We found broad `ui.notify` usage plus interactive dependencies (`select`, `confirm`, `input`) concentrated in command modules. Core Git/config services are largely independent and can be reused in a CLI-only runtime once a `ConsoleDisplayPrinter` boundary replaces direct `ctx.ui` usage.

## Findings

### A) `ctx.ui.*` usage inventory
- Total `ctx.ui.(notify|select|confirm|input|setStatus)` matches: **67** across **10 files**.
- Heavy interactive modules:
  - `src/cmds/cmdInit.ts` (interactive setup flow)
  - `src/cmds/cmdRemove.ts` (selection + confirmation flow)
- Notification-heavy modules:
  - `src/cmds/cmdSettings.ts`
  - `src/cmds/cmdCreate.ts`
  - `src/index.ts` (help/error + session status)

### B) `@mariozechner/pi-coding-agent` direct import inventory
Direct imports found in **12 files**:
- `src/index.ts`
- `src/types.ts`
- `src/services/completions.ts`
- `src/ui/templatePreview.ts`
- `src/cmds/cmdStatus.ts`
- `src/cmds/cmdInit.ts`
- `src/cmds/cmdPrune.ts`
- `src/cmds/cmdRemove.ts`
- `src/cmds/cmdCreate.ts`
- `src/cmds/cmdCd.ts`
- `src/cmds/cmdTemplates.ts`
- `src/cmds/cmdSettings.ts`

### C) Separation assessment
- **Already decoupled enough to reuse:** Git/service logic and config flows are mostly independent of UI runtime concerns.
- **Primary coupling hotspot:** command handlers typed against `ExtensionCommandContext` and directly invoking `ctx.ui`.
- **Migration seam:** introduce `ConsoleDisplayPrinter` + CLI context adapter and progressively replace `ctx.ui.*` callsites.

## Recommended next step
Define `ConsoleDisplayPrinter` contract and mapping table:
- `notify(level,message)` replacement strategy
- interaction contracts for `select`, `confirm`, `input`
- non-interactive fallback behaviors and error envelope

## References
- Repo scan (`grep`) for `ui.notify` and `ctx.ui.(notify|select|confirm|input|setStatus)` in `src/**/*.ts`.
- Repo scan (`grep`) for `from '@mariozechner/pi-coding-agent'` in `src/**/*.ts`.
