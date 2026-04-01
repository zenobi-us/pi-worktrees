---
id: 6d3b8c1f
title: derive-worktree-name-from-branch-slug-with-override
created_at: 2026-03-31T19:10:00+10:30
updated_at: 2026-04-01T19:32:00+10:30
status: completed
epic_id: b4e9d1a7
priority: high
story_points: 5
test_coverage: integration+unit
---

# Story: Derive worktree name from branch slug with override

## User Story
As a user, I want worktree directory names auto-derived from branch names so branch-first creation remains ergonomic and predictable.

## Acceptance Criteria
- [x] Default worktree name is generated via deterministic slugify of `<branch>`.
- [x] `--name <worktree-name>` overrides derived slug.
- [x] Slug collisions are detected and reported clearly.
- [x] Invalid `--name` values are rejected with actionable errors.

## Context
Branch-first UX shifts naming responsibility to derivation rules. Deterministic slug behavior is required.

## Out of Scope
- Generator command execution.
- Additional config-driven naming template variants.

## Tasks
- [x] [task-c5a9e3b1-implement-branch-slug-derivation-utility](./task-c5a9e3b1-implement-branch-slug-derivation-utility.md)
- [x] [task-7d4f2b8c-wire-name-override-and-validation-in-cmdcreate](./task-7d4f2b8c-wire-name-override-and-validation-in-cmdcreate.md)
- [x] [task-2e8c4a9d-add-collision-tests-for-derived-and-explicit-names](./task-2e8c4a9d-add-collision-tests-for-derived-and-explicit-names.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Slug default | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `parses-branch-first-and-derives-worktree-name-from-slug` | done |
| AC2 | Name override | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `uses-name-override-instead-of-derived-slug` | done |
| AC3 | Collision handling | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `reports-collision-for-derived-name-path` + `reports-collision-for-explicit-name` | done |
| AC4 | Invalid name handling | `tests/cmds/cmdCreate.branch-first.integration.test.ts` / `rejects-invalid-explicit-name-values` | done |

### Unit Test Coverage (via Tasks)
- [task-c5a9e3b1-implement-branch-slug-derivation-utility](./task-c5a9e3b1-implement-branch-slug-derivation-utility.md) → supports AC1
- [task-7d4f2b8c-wire-name-override-and-validation-in-cmdcreate](./task-7d4f2b8c-wire-name-override-and-validation-in-cmdcreate.md) → supports AC2, AC4
- [task-2e8c4a9d-add-collision-tests-for-derived-and-explicit-names](./task-2e8c4a9d-add-collision-tests-for-derived-and-explicit-names.md) → supports AC3
