---
id: 5a6b7c8d
title: add-matching-strategy-enum
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-20T21:27:00+10:30
status: done
epic_id: a7c9d4f2
phase_id: phase-2-validation-and-hardening
story_id: c91d7e34
assigned_to: jXiU4x3gLHioEGWjj2DH6W1i
---

# Task: Add matching strategy enum

## Objective
Add a configuration enum to control matcher tie/selection strategy per clarified story requirements.

## Related Story
- Story: [story-c91d7e34-implement-repo-matcher](./story-c91d7e34-implement-repo-matcher.md)
- Acceptance criteria supported: AC#6.

## Related Phase
- Epic: [epic-a7c9d4f2-multi-worktree-settings](./epic-a7c9d4f2-multi-worktree-settings.md)
- Phase: Phase 2: Validation and Hardening.

## Steps
- [x] Define enum schema and defaults.
- [x] Integrate enum into matcher decision path.
- [x] Update docs/help text for new config option.
- [x] Add tests for each supported strategy mode.

## Unit Tests
- `tests/services/config.schema.test.ts` (`accepts all supported strategy enum values`, `rejects invalid matchingStrategy enum values`): verifies schema-level enum validation for valid + invalid values → supports AC#6 of story c91d7e34.
- `tests/services/git.matcher.test.ts` (`uses first-wins strategy when configured`, `uses last-wins strategy when configured`): verifies strategy alters resolution deterministically → supports AC#6 of story c91d7e34.

## Expected Outcome
Users can explicitly configure matching strategy behavior, reducing ambiguity.

## Actual Outcome
Completed. `matchingStrategy` enum is present in schema/config, wired into matcher resolution (`fail-on-tie`, `first-wins`, `last-wins`), and now includes schema-level valid/invalid enum validation plus deterministic strategy behavior tests.

### Verification Evidence
- `src/services/config/schema.ts`: enum values declared in config schema.
- `src/services/git.ts`: tie-resolution branch applies selected strategy (`fail-on-tie` / `first-wins` / `last-wins`).
- `src/services/config/config.ts`: strategy is persisted and passed into matcher APIs.
- `src/index.ts`: help text documents strategy options.
- `tests/services/config.schema.test.ts`: asserts accepted strategy enum values and rejection of invalid values.
- `bun test tests/services/config.schema.test.ts tests/services/git.matcher.test.ts`: all strategy-related tests pass.

### Next Implementation Checkpoint
- [x] Add tests that assert each strategy mode produces deterministic outcomes.
- [x] Add schema-level enum validation test (valid + invalid values) and then promote to `done`.

## Lessons Learned
Schema-level validation tests are a fast guardrail for config contract regressions before integration/E2E work lands.
