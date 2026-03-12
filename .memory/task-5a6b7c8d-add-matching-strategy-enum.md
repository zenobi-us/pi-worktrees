---
id: 5a6b7c8d
title: add-matching-strategy-enum
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: todo
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
- [ ] Define enum schema and defaults.
- [ ] Integrate enum into matcher decision path.
- [ ] Update docs/help text for new config option.
- [ ] Add tests for each supported strategy mode.

## Unit Tests
- (pending) config schema enum validation test: verifies valid/invalid strategy values → supports AC#6 of story c91d7e34.
- (pending) matcher strategy behavior test: verifies strategy alters resolution deterministically → supports AC#6 of story c91d7e34.

## Expected Outcome
Users can explicitly configure matching strategy behavior, reducing ambiguity.

## Actual Outcome
Not started.

## Lessons Learned
Pending during execution.
