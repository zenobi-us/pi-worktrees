---
id: 4e9a1d6b
title: spec-legacy-feature-name-compatibility-policy
created_at: 2026-04-01T12:28:00+10:30
updated_at: 2026-04-01T12:31:01+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-1-contract-and-migration-design
story_id: 2c7f1a9e
assigned_to: session-20260331-1918
---

# Task: Specify legacy feature-name compatibility policy

## Objective
Lock migration behavior for legacy `/worktree create <feature-name>` assumptions and define when to warn vs fail.

## Related Story
- Story: [story-2c7f1a9e-define-branch-first-command-contract-and-precedence](./story-2c7f1a9e-define-branch-first-command-contract-and-precedence.md)
- Acceptance criteria supported: AC#4.

## Related Phase
- Epic: [epic-b4e9d1a7-configurable-branch-naming-for-worktree-create](./epic-b4e9d1a7-configurable-branch-naming-for-worktree-create.md)
- Phase: Phase 1: Contract and migration design.

## Steps
- [x] Define detection rule for legacy-style input ambiguity.
- [x] Define warning copy and strict-error transition policy.
- [x] Define compatibility test cases for migration period behavior.

## Policy Decision
Branch-first is canonical and never reinterprets user input. Compatibility is messaging-only during migration.

### Detection Rule (legacy-style token)
Flag input as "legacy-style" when all are true:
1. Command shape is exactly `/worktree create <token>` (single positional token, no `--name`).
2. `<token>` has no `/` separator.
3. `<token>` matches simple slug pattern `^[A-Za-z0-9._-]+$`.

This catches old feature-name usage patterns while avoiding behavior changes.

### Behavior by Mode
- **Warn mode (default in migration window):** proceed with branch-first behavior and emit warning.
- **Strict mode (post-migration toggle, then default):** reject with actionable error.

### Warning Copy (warn mode)
`Legacy create style detected: '/worktree create <feature-name>' is deprecated. '<token>' is now treated as the branch name. If you want old semantics, run '/worktree create feature/<token>' (optionally '--name <token>').`

### Strict Error Copy
`Legacy create style is no longer accepted. Use '/worktree create <branch> [--name <worktree-name>]' (for old semantics: '/worktree create feature/<token> --name <token>').`

### Transition Policy
1. Phase 2 implementation ships with warn mode enabled.
2. Docs/help include migration warning and explicit replacement commands.
3. Strict mode can be enabled in a later release once telemetry/user feedback confirms low warning frequency.

## Compatibility Test Cases
| Case | Input | Mode | Expected |
|---|---|---|---|
| C1 | `/worktree create login-flow` | warn | create branch `login-flow`, derived name `login-flow`, show deprecation warning |
| C2 | `/worktree create login-flow --name ui-login` | warn | create normally, no legacy warning (explicit naming path) |
| C3 | `/worktree create feature/login-flow` | warn | create normally, no legacy warning |
| C4 | `/worktree create login-flow` | strict | fail with strict migration error |
| C5 | `/worktree create bugfix/JIRA-1` | strict | create normally, no legacy error |

## Expected Outcome
A single migration policy that avoids ambiguous behavior and supports predictable rollout.
