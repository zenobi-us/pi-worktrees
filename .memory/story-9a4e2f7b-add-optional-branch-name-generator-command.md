---
id: 9a4e2f7b
title: add-optional-branch-name-generator-command
created_at: 2026-03-31T19:10:00+10:30
updated_at: 2026-04-01T20:15:00+10:30
status: done
epic_id: b4e9d1a7
priority: medium
story_points: 8
test_coverage: targeted
---

# Story: Add optional branch name generator command

## User Story
As an advanced user, I want to optionally generate branch names from a command so I can integrate custom naming logic (including AI naming) into my local workflow.

## Acceptance Criteria
- [x] Config schema supports optional `branchNameGenerator` command string.
- [x] Generator output is trimmed, sanitized, and validated as a branch name.
- [x] Timeout/failure behavior is deterministic and follows precedence contract fallback.
- [x] Security posture is documented (explicitly unsafe if misconfigured, user-owned command).

## Context
Generator mode is flexible but risky. It must stay opt-in and never replace deterministic default behavior.

## Out of Scope
- Providing sandboxing guarantees beyond current local command execution model.
- Managing secrets/providers used by external generator commands.

## Tasks
- [x] Extend schema with generator field.
- [x] Implement command execution wrapper with timeout and stderr capture.
- [x] Integrate fallback behavior into create flow.

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Schema support | `tests/services/config.loader.integration.test.ts` / `parses-branchNameGenerator` | done |
| AC2 | Output validation | `tests/services/branchNameGenerator.test.ts` / success+invalid-output cases | done |
| AC3 | Timeout/failure fallback | `tests/services/branchNameGenerator.test.ts` + `tests/cmds/cmdCreate.branch-first.integration.test.ts` / timeout+non-zero+empty+stop-flow | done |
| AC4 | Security docs | `README.md` section `Optional branch generator (safe opt-in)` | done |

### Unit Test Coverage (via Tasks)
- Task (to be created): generator command runner behaviors (success, timeout, empty output, invalid output) → satisfies AC2, AC3

## Notes
This story should be behind explicit docs and warnings, not silently enabled.
