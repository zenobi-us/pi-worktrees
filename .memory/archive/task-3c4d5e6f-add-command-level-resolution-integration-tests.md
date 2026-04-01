---
id: 3c4d5e6f
title: add-command-level-resolution-integration-tests
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-20T22:03:00+10:30
status: done
epic_id: a7c9d4f2
phase_id: phase-2-validation-and-hardening
story_id: e7b6a902
assigned_to: jXiU4x3gLHioEGWjj2DH6W1i
---

# Task: Add command-level resolution integration tests

## Objective
Add command-level integration tests for precedence, fallback, and `onCreate` execution order/failure-stop behavior.

## Related Story
- Story: [story-e7b6a902-add-matching-tests](./story-e7b6a902-add-matching-tests.md)
- Acceptance criteria supported: AC#1, AC#2, AC#3, AC#4.

## Related Phase
- Epic: [epic-a7c9d4f2-multi-worktree-settings](./epic-a7c9d4f2-multi-worktree-settings.md)
- Phase: Phase 2: Validation and Hardening.

## Steps
- [x] Build integration fixtures for exact/wildcard collisions.
- [x] Add no-match fallback integration scenarios.
- [x] Add `onCreate` ordered execution assertions.
- [x] Add failure-stop assertion when command in sequence fails.

## Unit Tests
- `tests/cmds/cmd.resolution.integration.test.ts` (`uses exact match over wildcard settings when creating a worktree`): verifies exact > wildcard precedence in command-level create flow → supports AC#1 of story e7b6a902.
- `tests/cmds/cmd.resolution.integration.test.ts` (`uses fallback pattern settings when no specific repo pattern matches`): verifies no-match fallback resolution in command-level create flow → supports AC#2 of story e7b6a902.
- `tests/cmds/oncreate.execution.integration.test.ts` (`runs onCreate commands in order`, `stops execution at first command failure`): verifies ordered `onCreate` execution and failure-stop behavior → supports AC#3, AC#4 of story e7b6a902.

## Expected Outcome
Command-level behavior is regression-protected for matching and execution semantics.

## Actual Outcome
Completed. Added command-level integration tests for precedence, fallback resolution, and `onCreate` order/failure-stop behavior.

### Verification Evidence
- `tests/cmds/cmd.resolution.integration.test.ts`: command-level create-flow coverage for exact-over-wildcard precedence and fallback resolution.
- `tests/cmds/oncreate.execution.integration.test.ts`: command hook execution-order and failure-stop coverage.
- `bun test tests/cmds`: pass (4/4).
- `bun test tests`: pass (15/15).

### Next Implementation Checkpoint
- [x] Add command integration fixtures for exact/wildcard/no-match.
- [x] Add `onCreate` ordered execution + failure-stop tests.
- [x] Move to `in-progress` after first integration test lands.

## Lessons Learned
Command-level tests are easiest to stabilize by mocking shell execution boundaries while keeping resolution logic realistic.
