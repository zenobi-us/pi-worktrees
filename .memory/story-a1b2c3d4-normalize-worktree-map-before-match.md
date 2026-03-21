---
id: a1b2c3d4
title: normalize-worktree-map-before-match
created_at: 2026-03-21T22:36:02+10:30
updated_at: 2026-03-21T22:55:00+10:30
status: done
epic_id: f1c2d3e4
priority: high
story_points: 1
test_coverage: none
---

# Story: Normalize worktree map before matchRepo

## User Story
As a maintainer, I want fallback/default worktree settings normalized into the worktree map before matching so that `matchRepo` only matches and does not own fallback behavior.

## Acceptance Criteria
- [x] Pre-match normalization injects/ensures fallback/default in the map consumed by matcher.
- [x] `matchRepo` no longer contains fallbacking behavior.
- [x] Tests prove no-match still resolves to fallback/default behavior through normalization path.

## Tasks
- [task-b7c8d9e0-normalize-fallback-into-map-pre-match](./task-b7c8d9e0-normalize-fallback-into-map-pre-match.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Normalization happens pre-match | `tests/services/config.service.integration.test.ts` (to add/update) | pending |
| AC2 | matchRepo no longer fallbacks | `tests/services/git.matcher.test.ts` (to add/update) | pending |
| AC3 | No-match behavior preserved | `tests/cmds/cmd.resolution.integration.test.ts` (to add/update) | pending |
