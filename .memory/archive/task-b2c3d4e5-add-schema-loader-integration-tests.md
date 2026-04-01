---
id: b2c3d4e5
title: add-schema-loader-integration-tests
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-20T21:35:00+10:30
status: done
epic_id: a7c9d4f2
phase_id: phase-2-validation-and-hardening
story_id: b2e9f0aa
assigned_to: jXiU4x3gLHioEGWjj2DH6W1i
---

# Task: Add schema/loader integration tests

## Objective
Add story-level integration coverage for parser, onCreate normalization, legacy parsing, and stable persistence behavior.

## Related Story
- Story: [story-b2e9f0aa-implement-schema-loader-updates](./story-b2e9f0aa-implement-schema-loader-updates.md)
- Acceptance criteria supported: AC#1, AC#2, AC#3, AC#4.

## Related Phase
- Epic: [epic-a7c9d4f2-multi-worktree-settings](./epic-a7c9d4f2-multi-worktree-settings.md)
- Phase: Phase 2: Validation and Hardening.

## Steps
- [x] Add integration test cases for `worktrees` map parsing.
- [x] Add test cases for `onCreate` string and array support.
- [x] Add legacy shape parseability tests.
- [x] Add persistence round-trip stability assertions.

## Unit Tests
- `tests/services/config.loader.integration.test.ts` (`parses worktrees map with onCreate as string or string[]`): verifies `worktrees` parsing and `onCreate` normalization support → supports AC#1, AC#2 of story b2e9f0aa.
- `tests/services/config.loader.integration.test.ts` (`keeps legacy singular shape parseable via migration path`): verifies legacy shape compatibility and migration path behavior → supports AC#3 of story b2e9f0aa.
- `tests/services/config.loader.integration.test.ts` (`persists config with stable round-trip shape`): verifies stable persisted output shape through save and parse round-trip → supports AC#4 of story b2e9f0aa.

## Expected Outcome
All schema/loader acceptance criteria have linked passing integration tests.

## Actual Outcome
Completed. Added config loader integration coverage for `worktrees` parsing, `onCreate` string/array handling, legacy shape parseability, and persistence round-trip stability.

### Verification Evidence
- `tests/services/config.loader.integration.test.ts`: includes three integration tests covering parser, migration compatibility, and persistence round-trip behavior.
- `bun test tests/services/config.loader.integration.test.ts`: all new integration tests pass (3/3).

### Next Implementation Checkpoint
- [x] Create integration harness for config load/save scenarios.
- [x] Add `worktrees` parse, `onCreate` normalize, legacy shape, and roundtrip persistence tests.
- [x] Move to `in-progress` once first test file is added.

## Lessons Learned
Mock-backed integration tests are sufficient to validate loader contracts without requiring filesystem-bound config fixtures.
