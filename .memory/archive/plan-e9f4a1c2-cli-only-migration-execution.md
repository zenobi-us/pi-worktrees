---
id: 4b8e2d71
title: CLI-only migration execution plan
created_at: 2026-03-23T19:13:02+10:30
updated_at: 2026-03-23T19:13:02+10:30
status: active
epic_id: e9f4a1c2
---

# Plan: CLI-only migration execution

## Goal
Execute epic `e9f4a1c2` by removing pi-mono UI dependency paths, introducing a dedicated console interaction boundary, and stabilizing a TypeScript-first CLI architecture on Bun.

## Architecture Decision Baseline
- Primary: `@effect/cli` + `@effect/platform-bun`
- Fallback: Stricli (`@stricli/core`)
- Mandatory boundary: `ConsoleDisplayPrinter` service for all user-facing display/interaction

## Phase Plan

### Phase A — Separation audit (short)
1. Inventory `ui.notify` and adjacent interaction call sites.
2. Map dependency edges to pi-coding-agent surfaces.
3. Classify each edge: keep, wrap, remove.

**Exit criteria**
- A complete call-site inventory exists.
- No unknown interaction pathways remain.

### Phase B — Interaction boundary definition
1. Define `ConsoleDisplayPrinter` interface and message model.
2. Define interactive/non-interactive behavior contract.
3. Define typed error envelope for CLI-facing failures.

**Exit criteria**
- Contract doc and TypeScript interface are approved.
- Mapping exists from old `ui.notify` usage to new service methods.

### Phase C — Spike + framework validation
1. Build one vertical slice command using `@effect/cli` + Bun.
2. Route command output through `ConsoleDisplayPrinter`.
3. Verify typed args + typed error envelope + test harness path.

**Exit criteria**
- Spike command runs on Bun.
- Type contracts validated in tests.
- Decision remains `@effect/cli` (or fallback explicitly triggered to Stricli).

### Phase D — Migration rollout
1. Replace `ui.notify` call sites incrementally by module.
2. Keep adapter shim temporarily for migration safety.
3. Remove deprecated UI surfaces once all call sites are migrated.

**Exit criteria**
- Zero production `ui.notify` dependencies.
- CLI execution paths pass regression tests.

### Phase E — Consolidation
1. Update docs/help for CLI-only interaction model.
2. Remove dead dependency wiring to pi-mono UI paths.
3. Final verification sweep and release checklist.

**Exit criteria**
- Docs aligned with behavior.
- No dependency direction toward pi-mono UI surfaces.

## Risk Register
- Effect complexity slows onboarding.
- Hidden interaction pathways discovered late.
- Interactive UX drift without contract tests.

## Mitigations
- Keep a small spike first; no broad rewrites before proof.
- Enforce boundary tests around `ConsoleDisplayPrinter`.
- Use Stricli fallback only via explicit decision checkpoint.
