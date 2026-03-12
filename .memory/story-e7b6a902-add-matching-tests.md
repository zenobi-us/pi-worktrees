---
id: e7b6a902
title: add-matching-tests
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-13T09:05:48+10:30
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
- [ ] Command-level integration tests verify precedence + fallback + `onCreate` execution order and failure-stop behavior.
- [ ] Integration coverage is added in both config-service and command-level test suites.

## Context
This story provides confidence around deterministic behavior under future changes.

## Out of Scope
- Full UI/interactive flow testing.

## Tasks
- [task-3c4d5e6f-add-command-level-resolution-integration-tests](./task-3c4d5e6f-add-command-level-resolution-integration-tests.md)
- [task-7a8b9c0d-add-config-service-integration-coverage](./task-7a8b9c0d-add-config-service-integration-coverage.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Exact vs wildcard precedence | Planned command resolver integration suite | not-implemented |
| AC2 | No-match fallback | Planned command resolver integration suite | not-implemented |
| AC3 | onCreate list handling | Planned command resolver integration suite | not-implemented |
| AC4 | onCreate execution order and failure-stop | Planned command resolver integration suite | not-implemented |
| AC5 | Integration coverage in config + command suites | Planned cross-suite integration checks | not-implemented |

### Unit Test Coverage (via Tasks)
- Task 3c4d5e6f: command-level integration for precedence, fallback, and onCreate sequence/failure-stop → supports AC#1-AC#4.
- Task 7a8b9c0d: config-service integration coverage aligned with command-level suite → supports AC#5.

## Notes
This remains the main open hardening story for the epic.
