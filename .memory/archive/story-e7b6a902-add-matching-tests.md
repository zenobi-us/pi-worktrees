---
id: e7b6a902
title: add-matching-tests
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-20T22:12:00+10:30
status: done
epic_id: a7c9d4f2
priority: high
story_points: 3
test_coverage: full
---

# Story: Add tests for matching and fallback

## User Story
As a maintainer, I want automated tests for matching and fallback behavior so that config resolution changes do not regress.

## Acceptance Criteria
- [x] Tests verify exact match vs wildcard precedence.
- [x] Tests verify no-match fallback behavior.
- [x] Tests verify `onCreate` list handling.
- [x] Command-level integration tests verify precedence + fallback + `onCreate` execution order and failure-stop behavior.
- [x] Integration coverage is added in both config-service and command-level test suites.

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
| AC1 | Exact vs wildcard precedence | `tests/cmds/cmd.resolution.integration.test.ts` (`uses exact match over wildcard settings when creating a worktree`) | passing |
| AC2 | No-match fallback | `tests/cmds/cmd.resolution.integration.test.ts` (`uses fallback pattern settings when no specific repo pattern matches`) | passing |
| AC3 | onCreate list handling | `tests/cmds/oncreate.execution.integration.test.ts` (`runs onCreate commands in order`) | passing |
| AC4 | onCreate execution order and failure-stop | `tests/cmds/oncreate.execution.integration.test.ts` (`stops execution at first command failure`) | passing |
| AC5 | Integration coverage in config + command suites | `tests/services/config.service.integration.test.ts` + command-level suites | passing |

### Unit Test Coverage (via Tasks)
- Task 3c4d5e6f: command-level integration for precedence, fallback, and onCreate sequence/failure-stop → supports AC#1-AC#4.
- Task 7a8b9c0d: config-service integration coverage aligned with command-level suite → supports AC#5.

## Verification Evidence
- `tests/services/config.service.integration.test.ts`: verifies config-service precedence, fallback, and onCreate command-list compatibility.
- `tests/cmds/cmd.resolution.integration.test.ts`: verifies command-level precedence and fallback behavior in create flow.
- `tests/cmds/oncreate.execution.integration.test.ts`: verifies ordered `onCreate` execution and stop-on-failure behavior.
- `bun test tests/services/config.service.integration.test.ts`: config-service integration suite passes (3/3).
- `bun test tests/cmds`: command-level suite passes (4/4).
- `bun test tests`: all current integration/unit suites pass (18/18).
- Task `3c4d5e6f` and task `7a8b9c0d` are both done, closing AC#1-AC#5.

## Next Story Checkpoint
- [x] Add command-level integration suite for AC#1-AC#4.
- [x] Add config-service integration suite for AC#5.
- [x] Mark criteria complete only after tests exist and are passing.

## Notes
This remains the main open hardening story for the epic.
