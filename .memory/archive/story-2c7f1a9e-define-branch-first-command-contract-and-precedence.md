---
id: 2c7f1a9e
title: define-branch-first-command-contract-and-precedence
created_at: 2026-03-31T19:10:00+10:30
updated_at: 2026-04-01T12:31:01+10:30
status: completed
epic_id: b4e9d1a7
priority: critical
story_points: 3
test_coverage: none
---

# Story: Define branch-first command contract and precedence

## User Story
As a maintainer, I want a clear branch-first `/worktree create` contract so users can predict branch creation and worktree naming behavior.

## Acceptance Criteria
- [x] Contract is defined as `/worktree create <branch> [--name <worktree-name>]`.
- [x] Precedence is defined as: explicit `--name` > `slugify(branch)` for worktree name.
- [x] Optional generator/template interactions are defined without conflicting with branch-first input.
- [x] Compatibility mode for legacy usage is defined (warning vs strict error).

## Context
Branch is currently synthesized from feature name. This story flips source-of-truth to user-provided branch.

## Out of Scope
- Implementing generator execution.
- Final docs wording.

## Tasks
- [x] [task-31b7f2c4-author-branch-first-behavior-matrix](./task-31b7f2c4-author-branch-first-behavior-matrix.md)
- [x] [task-4e9a1d6b-spec-legacy-feature-name-compatibility-policy](./task-4e9a1d6b-spec-legacy-feature-name-compatibility-policy.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Branch-first contract | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `accepts-branch-as-first-arg` | pending |
| AC2 | Name precedence | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `uses-name-override-over-slug` | pending |
| AC3 | Generator/template interaction | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `branch-first-overrides-generator-template` | pending |
| AC4 | Compatibility behavior | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `legacy-input-warning-or-reject` | pending |

### Unit Test Coverage (via Tasks)
- [task-31b7f2c4-author-branch-first-behavior-matrix](./task-31b7f2c4-author-branch-first-behavior-matrix.md) → supports AC1, AC2, AC3
- [task-4e9a1d6b-spec-legacy-feature-name-compatibility-policy](./task-4e9a1d6b-spec-legacy-feature-name-compatibility-policy.md) → supports AC4
