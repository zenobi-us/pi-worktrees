---
id: d3a54f18
title: add-compat-migration-bridge
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-12T22:57:00+10:30
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
- [x] Migration behavior is documented.
- [ ] Story-level E2E verification is linked and passing for all criteria.

## Context
Backward compatibility is required to avoid disrupting existing workflows.

## Out of Scope
- Automatic file rewrite migration tooling.

## Tasks
- No task files created for this story in memory.

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Legacy worktree shape accepted | Planned legacy config integration test | not-implemented |
| AC2 | Legacy flat fields accepted | Planned legacy config integration test | not-implemented |
| AC3 | Fallback to legacy on no match | Planned fallback integration test | not-implemented |
| AC4 | Migration documented | README migration checklist review | passing |

### Unit Test Coverage (via Tasks)
- Unit test mappings are not yet represented via task files in memory.

## Notes
Compatibility behaviors are intentionally preserved during transition period.
