---
id: d3a54f18
title: add-compat-migration-bridge
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: in-progress
epic_id: a7c9d4f2
priority: high
story_points: 3
test_coverage: partial
---

# Story: Add compatibility/migration bridge

## User Story
As an existing user, I want old single-worktree config to keep working while new multi-worktree config is introduced so that upgrades are non-breaking.

## Acceptance Criteria
- [x] Legacy `worktree` shape is accepted.
- [x] Legacy flat fields continue to parse.
- [x] Resolver falls back to legacy settings when no pattern matches.
- [ ] Migration from legacy to new shape is executed by `pi-extension-config`.
- [ ] A migration set is authored and versioned for this transition.
- [ ] Deprecation behavior follows migration policy from `pi-extension-config` (timeline to be defined there).
- [ ] Story-level E2E verification is linked and passing for all criteria.

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
| AC1 | Legacy worktree shape accepted | Planned legacy config integration test | not-implemented |
| AC2 | Legacy flat fields accepted | Planned legacy config integration test | not-implemented |
| AC3 | Fallback to legacy on no match | Planned fallback integration test | not-implemented |
| AC4 | Migration via pi-extension-config runs | Planned migration integration test | not-implemented |
| AC5 | Migration set present and versioned | Planned migration-set verification test | not-implemented |
| AC6 | Deprecation policy matches migration framework | Planned migration-policy verification | not-implemented |

### Unit Test Coverage (via Tasks)
- Task 9e0f1a2b: migration-set registration, transform behavior, and policy compliance tests → supports AC#4-AC#6.

## Notes
Compatibility behavior should converge on shared migration infra, not extension-local bespoke scripts.
