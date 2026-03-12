---
id: b2e9f0aa
title: implement-schema-loader-updates
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: in-progress
epic_id: a7c9d4f2
priority: critical
story_points: 5
test_coverage: partial
---

# Story: Implement schema and loader updates

## User Story
As a user, I want config loading to support both legacy singular settings and new multi-worktree settings so that I can migrate without breakage.

## Acceptance Criteria
- [x] Parser accepts `worktrees: Record<string, WorktreeSettings>`.
- [x] `WorktreeSettings.onCreate` supports `string | string[]`.
- [x] Legacy singular shape remains parseable.
- [x] Persisted output remains stable and predictable.
- [ ] Story-level E2E verification is linked and passing for all criteria.

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
| AC1 | Parser accepts worktrees map | Planned integration config load test | not-implemented |
| AC2 | onCreate supports string/array | Planned integration config load test | not-implemented |
| AC3 | Legacy shape parseable | Planned integration config load test | not-implemented |
| AC4 | Persist output stable | Planned integration config save test | not-implemented |

### Unit Test Coverage (via Tasks)
- Task b2c3d4e5: integration coverage for parser, normalization, legacy parsing, and persistence round-trip → supports AC#1-AC#4.

## Notes
Implementation tracked primarily in `src/services/config.ts`.
