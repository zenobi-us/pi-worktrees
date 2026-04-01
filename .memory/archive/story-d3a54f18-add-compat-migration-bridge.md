---
id: d3a54f18
title: add-compat-migration-bridge
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-20T22:32:00+10:30
status: done
epic_id: a7c9d4f2
priority: high
story_points: 3
test_coverage: full
---

# Story: Add compatibility/migration bridge

## User Story
As an existing user, I want old single-worktree config to keep working while new multi-worktree config is introduced so that upgrades are non-breaking.

## Acceptance Criteria
- [x] Legacy `worktree` shape is accepted.
- [x] Legacy flat fields continue to parse.
- [x] Resolver falls back to legacy settings when no pattern matches.
- [x] Migration from legacy to new shape is executed by `pi-extension-config`.
- [x] A migration set is authored and versioned for this transition.
- [x] Deprecation behavior follows migration policy from `pi-extension-config` (timeline to be defined there).
- [x] Story-level E2E verification is linked and passing for all criteria.

## Context
Backward compatibility is required to avoid disrupting existing workflows.

## Out of Scope
- Ad-hoc migration logic outside the shared `pi-extension-config` migration mechanism.

## Tasks
- [task-9e0f1a2b-author-migration-set-worktree-to-worktrees](./task-9e0f1a2b-author-migration-set-worktree-to-worktrees.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Legacy worktree shape accepted | `tests/services/config.loader.integration.test.ts` (`keeps legacy singular shape parseable via migration path`) | passing |
| AC2 | Legacy flat fields accepted | `tests/services/config.loader.integration.test.ts` (`keeps legacy singular shape parseable via migration path`) | passing |
| AC3 | Fallback to legacy on no match | `tests/services/config.migrations.test.ts` (`uses migrated worktrees fallback pattern for no-match resolution`) | passing |
| AC4 | Migration via pi-extension-config runs | `tests/services/config.migrations.test.ts` (`migrates legacy worktree shape to worktrees fallback pattern`) | passing |
| AC5 | Migration set present and versioned | `tests/services/config.migrations.test.ts` (`is versioned and executable as an ordered migration set`) | passing |
| AC6 | Deprecation policy matches migration framework | `tests/services/config.migrations.test.ts` (`keeps migration behavior policy-driven through framework validation`) | passing |

### Unit Test Coverage (via Tasks)
- Task 9e0f1a2b: migration-set registration, transform behavior, and policy compliance tests → supports AC#4-AC#6.

## Verification Evidence
- `src/services/config/migrations/01-flat-single.ts` + `src/services/config/migrations/02-worktree-to-worktrees.ts`: versioned migration set now covers legacy flat/singular input through `worktrees` migration.
- `src/services/config/config.ts`: config service now registers both migrations in order.
- `tests/services/config.migrations.test.ts`: verifies migration execution, versioned set behavior, and policy-aligned deprecation behavior.
- `README.md` migration note: documents migration chain and reliance on framework migration policy.
- `tests/services/config.loader.integration.test.ts`: validates legacy singular and flat compatibility parse path.
- `tests/services/config.migrations.test.ts`: now includes explicit migrated fallback resolution assertion for `worktrees["**"]`.

## Next Story Checkpoint
- [x] Implement migration-set + version metadata (task `9e0f1a2b`).
- [x] Add explicit fallback-to-legacy integration assertion after migration (`worktree` -> `worktrees["**"]`) and link it in E2E table.

## Notes
Compatibility behavior should converge on shared migration infra, not extension-local bespoke scripts.
