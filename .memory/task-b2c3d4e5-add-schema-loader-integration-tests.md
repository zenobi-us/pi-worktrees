---
id: b2c3d4e5
title: add-schema-loader-integration-tests
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: todo
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
- [ ] Add integration test cases for `worktrees` map parsing.
- [ ] Add test cases for `onCreate` string and array support.
- [ ] Add legacy shape parseability tests.
- [ ] Add persistence round-trip stability assertions.

## Unit Tests
- (pending) integration/config-load-worktrees: verifies `worktrees` parsing and `onCreate` normalization → supports AC#1, AC#2 of story b2e9f0aa.
- (pending) integration/config-legacy-shape: verifies legacy shape and flat fields parse path → supports AC#3 of story b2e9f0aa.
- (pending) integration/config-persist-roundtrip: verifies stable persisted output → supports AC#4 of story b2e9f0aa.

## Expected Outcome
All schema/loader acceptance criteria have linked passing integration tests.

## Actual Outcome
Not started.

## Lessons Learned
Pending during execution.
