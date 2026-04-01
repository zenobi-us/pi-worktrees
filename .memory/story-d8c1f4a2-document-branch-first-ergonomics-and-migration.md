---
id: d8c1f4a2
title: document-branch-first-ergonomics-and-migration
created_at: 2026-03-31T19:10:00+10:30
updated_at: 2026-04-01T19:45:00+10:30
status: completed
epic_id: b4e9d1a7
priority: high
story_points: 2
test_coverage: none
---

# Story: Document branch-first ergonomics and migration

## User Story
As a user, I want clear docs for the new branch-first create flow so I can migrate without confusion.

## Acceptance Criteria
- [x] Docs show `/worktree create <branch> [--name <worktree-name>]` as primary usage.
- [x] Docs explain name derivation via `slugify(branch)`.
- [x] Docs explain legacy behavior and migration warnings/errors.
- [x] Help text examples reflect branch-first workflow.

## Context
Without migration docs, existing users may misinterpret `<feature-name>` behavior.

## Out of Scope
- Broader docs reorganization.

## Tasks
- [x] [task-9c1e7b4a-update-readme-branch-first-usage-and-migration](./task-9c1e7b4a-update-readme-branch-first-usage-and-migration.md)
- [x] [task-5b2d8f3e-refresh-cli-help-examples-for-branch-first-flow](./task-5b2d8f3e-refresh-cli-help-examples-for-branch-first-flow.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Primary usage docs | Documentation review checklist | completed |
| AC2 | Slug derivation docs | Documentation review checklist | completed |
| AC3 | Migration docs | Documentation review checklist | completed |
| AC4 | Help text updates | `src/index.ts` help text review | completed |

### Unit Test Coverage (via Tasks)
- [task-9c1e7b4a-update-readme-branch-first-usage-and-migration](./task-9c1e7b4a-update-readme-branch-first-usage-and-migration.md) → supports AC1, AC2, AC3
- [task-5b2d8f3e-refresh-cli-help-examples-for-branch-first-flow](./task-5b2d8f3e-refresh-cli-help-examples-for-branch-first-flow.md) → supports AC4
