---
id: b2e9f0aa
title: implement-schema-loader-updates
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-20T22:18:00+10:30
status: done
epic_id: a7c9d4f2
priority: critical
story_points: 5
test_coverage: full
---

# Story: Implement schema and loader updates

## User Story
As a user, I want config loading to support both legacy singular settings and new multi-worktree settings so that I can migrate without breakage.

## Acceptance Criteria
- [x] Parser accepts `worktrees: Record<string, WorktreeSettings>`.
- [x] `WorktreeSettings.onCreate` supports `string | string[]`.
- [x] Legacy singular shape remains parseable.
- [x] Persisted output remains stable and predictable.
- [x] Story-level E2E verification is linked and passing for all criteria.

## Context
Schema and loader behavior are the foundation for downstream matcher and command behavior.

## Out of Scope
- Repo URL pattern matching algorithm details.

## Tasks
- [task-b2c3d4e5-add-schema-loader-integration-tests](./task-b2c3d4e5-add-schema-loader-integration-tests.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Parser accepts worktrees map | `tests/services/config.loader.integration.test.ts` (`parses worktrees map with onCreate as string or string[]`) | passing |
| AC2 | onCreate supports string/array | `tests/services/config.loader.integration.test.ts` (`parses worktrees map with onCreate as string or string[]`) | passing |
| AC3 | Legacy shape parseable | `tests/services/config.loader.integration.test.ts` (`keeps legacy singular shape parseable via migration path`) | passing |
| AC4 | Persist output stable | `tests/services/config.loader.integration.test.ts` (`persists config with stable round-trip shape`) | passing |

### Unit Test Coverage (via Tasks)
- Task b2c3d4e5: integration coverage for parser, normalization, legacy parsing, and persistence round-trip → supports AC#1-AC#4.

## Verification Evidence
- `src/services/config/schema.ts`: parser schema accepts `worktrees` map and `onCreate` as `string | string[]`.
- `src/services/config/config.ts`: parse/save paths for `worktrees` and `matchingStrategy` are implemented.
- `src/services/config/migrations/01-flat-single.ts`: legacy singular/flat compatibility parse path exists.
- `tests/services/config.loader.integration.test.ts`: integration coverage now links concrete tests for AC#1-AC#4.
- `bun test tests/services/config.loader.integration.test.ts`: all linked tests pass locally (3/3).

## Next Story Checkpoint
- [x] Land integration tests from task `b2c3d4e5` and link concrete test files/cases.
- [x] Re-evaluate `test_coverage` once those tests run in CI.

## Notes
Implementation tracked primarily in `src/services/config.ts`.
