---
id: 7a8b9c0d
title: add-config-service-integration-coverage
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-20T22:11:00+10:30
status: done
epic_id: a7c9d4f2
phase_id: phase-2-validation-and-hardening
story_id: e7b6a902
assigned_to: jXiU4x3gLHioEGWjj2DH6W1i
---

# Task: Add config-service integration coverage

## Objective
Ensure integration coverage exists in config-service suite to complement command-level tests and satisfy cross-suite requirement.

## Related Story
- Story: [story-e7b6a902-add-matching-tests](./story-e7b6a902-add-matching-tests.md)
- Acceptance criteria supported: AC#5.

## Related Phase
- Epic: [epic-a7c9d4f2-multi-worktree-settings](./epic-a7c9d4f2-multi-worktree-settings.md)
- Phase: Phase 2: Validation and Hardening.

## Steps
- [x] Identify config-service integration harness points.
- [x] Add integration scenarios for matcher + fallback behavior.
- [x] Validate alignment with command-level suite expectations.
- [x] Document suite ownership and maintenance notes.

## Unit Tests
- `tests/services/config.service.integration.test.ts` (`provides worktree settings that resolve exact match over wildcard`, `provides worktree settings that fall back to default when no pattern matches`): verifies precedence/fallback in config-service context → supports AC#5 of story e7b6a902.
- `tests/services/config.service.integration.test.ts` (`keeps onCreate values compatible with command-list normalization in command layer`): verifies onCreate values remain compatible with command-list normalization expectations → supports AC#5 of story e7b6a902.

## Expected Outcome
Both config-service and command-level suites provide aligned integration confidence.

## Actual Outcome
Completed. Added config-service integration coverage for matcher precedence, no-match fallback behavior, and onCreate command-list compatibility to complement command-level tests.

### Verification Evidence
- `tests/services/config.service.integration.test.ts`: config-service integration coverage for precedence, fallback, and onCreate command-list compatibility.
- `tests/cmds/cmd.resolution.integration.test.ts` + `tests/cmds/oncreate.execution.integration.test.ts`: command-level integration behavior remains aligned with config-service assertions.
- `bun test tests/services/config.service.integration.test.ts`: pass (3/3).
- `bun test tests`: pass (18/18).

### Next Implementation Checkpoint
- [x] Add config-service integration harness for matcher/fallback coverage.
- [x] Add onCreate normalization integration assertions.
- [x] Move to `in-progress` once tests are added.

## Lessons Learned
Cross-suite assertions should exercise identical config contracts from both service and command entry points to prevent drift.
