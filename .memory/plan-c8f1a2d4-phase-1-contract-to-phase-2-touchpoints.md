---
id: c8f1a2d4
title: phase-1-contract-to-phase-2-touchpoints
created_at: 2026-04-01T12:31:01+10:30
updated_at: 2026-04-01T12:31:01+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-1-contract-and-migration-design
---

# Plan: Prepare code changes from Phase 1 contract

## Locked Contract Inputs (from Phase 1)
- Command shape: `/worktree create <branch> [--name <worktree-name>]`.
- Precedence: `--name` overrides `slugify(branch)`.
- Migration policy: legacy-style single-token input warns in migration mode; strict mode errors later.

## Code Touchpoints
1. `src/cmds/cmdCreate.ts`
   - Replace current `featureName = args.trim()` parsing with token parser:
     - required positional `<branch>`
     - optional `--name <worktree-name>`
     - usage/duplicate/missing-value errors
   - Branch source becomes explicit `<branch>` (remove hardcoded `feature/${featureName}`).
   - Derived worktree name via `slugify(branch)` when `--name` absent.
   - Collision checks updated to compare against derived/explicit name + branch.
   - Add migration warning hook for legacy-style token detection.

2. `src/index.ts`
   - Update help line:
     - from `/worktree create <feature-name>`
     - to `/worktree create <branch> [--name <worktree-name>]`
   - Add one migration note in help text with legacy replacement examples.

3. `src/cmds/shared.ts` (if needed)
   - Place slug helper in shared utility or dedicated module if reused.
   - Keep sanitization rules aligned with Phase 1 slug contract.

## Test Touchpoints
1. New integration tests:
   - `tests/cmds/cmdCreate.branch-first.integration.test.ts`
     - branch-first positional parsing
     - `--name` precedence
     - legacy warning/strict behavior contract
   - `tests/cmds/cmdCreate.name-derivation.integration.test.ts`
     - slug derivation rules
     - derived-name collision handling
     - invalid explicit `--name` errors

2. Existing tests to update:
   - `tests/cmds/cmd.resolution.integration.test.ts` (only if command usage snapshots/assertions include old `<feature-name>` text)

## Phase 2 Task Mapping
- `task-c5a9e3b1`: implement slug utility and unit coverage.
- `task-7d4f2b8c`: wire parser + `--name` + validation in `cmdCreate`.
- `task-2e8c4a9d`: add collision-focused integration tests for derived and explicit names.

## Implementation Sequence
1. Introduce slug function + unit tests.
2. Refactor `cmdCreate` parsing and precedence.
3. Update help text and migration messaging.
4. Add/adjust integration tests.
5. Run `bun test` and fix regressions.
