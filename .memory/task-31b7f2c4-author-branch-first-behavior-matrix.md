---
id: 31b7f2c4
title: author-branch-first-behavior-matrix
created_at: 2026-04-01T12:28:00+10:30
updated_at: 2026-04-01T12:31:01+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-1-contract-and-migration-design
story_id: 2c7f1a9e
assigned_to: session-20260331-1918
---

# Task: Author branch-first behavior matrix

## Objective
Define concrete input/output behavior examples for `/worktree create <branch> [--name <worktree-name>]`, including precedence and edge cases.

## Related Story
- Story: [story-2c7f1a9e-define-branch-first-command-contract-and-precedence](./story-2c7f1a9e-define-branch-first-command-contract-and-precedence.md)
- Acceptance criteria supported: AC#1, AC#2, AC#3.

## Related Phase
- Epic: [epic-b4e9d1a7-configurable-branch-naming-for-worktree-create](./epic-b4e9d1a7-configurable-branch-naming-for-worktree-create.md)
- Phase: Phase 1: Contract and migration design.

## Steps
- [x] Enumerate branch-first command examples for valid and invalid input.
- [x] Define precedence table: `--name` override vs derived slug.
- [x] Capture interaction notes for optional generator behavior without overriding explicit branch input.

## Behavior Matrix
| Case | Input | Branch used | Worktree name | Result |
|---|---|---|---|---|
| 1 | `/worktree create feature/login` | `feature/login` | `feature-login` | success |
| 2 | `/worktree create feature/login --name login-ui` | `feature/login` | `login-ui` | success (`--name` overrides derived name) |
| 3 | `/worktree create bugfix/JIRA-123/fix-npe` | `bugfix/JIRA-123/fix-npe` | `bugfix-jira-123-fix-npe` | success |
| 4 | `/worktree create release/2026.04` | `release/2026.04` | `release-2026-04` | success |
| 5 | `/worktree create feature/login --name bad/name` | `feature/login` | n/a | fail (`--name` invalid for folder path segment) |
| 6 | `/worktree create` | n/a | n/a | fail (usage error: missing `<branch>`) |
| 7 | `/worktree create feature/login --name` | n/a | n/a | fail (usage error: missing `--name` value) |
| 8 | `/worktree create feature/login --name login-ui --name login-ui-2` | n/a | n/a | fail (duplicate `--name`) |
| 9 | `/worktree create feature/login` when derived name path exists | `feature/login` | `feature-login` | fail (worktree collision) |
| 10 | `/worktree create feature/login --name login-ui` when branch exists | `feature/login` | `login-ui` | fail (branch already exists) |

## Precedence Contract
1. First positional argument is always the branch source-of-truth.
2. Worktree name defaults to `slugify(branch)`.
3. Explicit `--name <worktree-name>` overrides `slugify(branch)`.
4. Optional generator/template features (future story 9a4e2f7b) may suggest a branch only when `<branch>` is omitted by a different command mode; they never override explicit `<branch>` in this command.

## Slug Rules (Phase 1 contract)
- Lowercase output.
- Replace `/`, whitespace, `_`, and `.` separators with `-`.
- Collapse repeated separators to a single `-`.
- Trim leading/trailing `-`.
- Reject result if empty after normalization.

## Expected Outcome
A behavior matrix that implementation and tests can consume without ambiguity.
