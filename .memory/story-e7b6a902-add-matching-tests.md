---
id: e7b6a902
title: add-matching-tests
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-12T22:50:00+10:30
status: in-progress
epic_id: a7c9d4f2
priority: high
story_points: 3
test_coverage: partial
---

# Story: Add tests for matching and fallback

## User Story
As a maintainer, I want automated tests for matching and fallback behavior so that config resolution changes do not regress.

## Acceptance Criteria
- [x] Tests verify exact match vs wildcard precedence.
- [x] Tests verify no-match fallback behavior.
- [x] Tests verify `onCreate` list handling.
- [ ] Command-level integration tests verify end-to-end settings resolution.

## Context
This story provides confidence around deterministic behavior under future changes.

## Out of Scope
- Full UI/interactive flow testing.

## Tasks
- No task files created for this story in memory.

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Exact vs wildcard precedence | Planned command resolver integration suite | not-implemented |
| AC2 | No-match fallback | Planned command resolver integration suite | not-implemented |
| AC3 | onCreate list handling | Planned command resolver integration suite | not-implemented |
| AC4 | End-to-end command-level resolution | Planned command resolver integration suite | not-implemented |

### Unit Test Coverage (via Tasks)
- Existing matching/config unit tests are referenced in implementation notes; integration coverage remains open.

## Notes
This remains the main open hardening story for the epic.
