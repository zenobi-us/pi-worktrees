---
id: 3c4d5e6f
title: add-command-level-resolution-integration-tests
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: todo
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
- [ ] Build integration fixtures for exact/wildcard collisions.
- [ ] Add no-match fallback integration scenarios.
- [ ] Add `onCreate` ordered execution assertions.
- [ ] Add failure-stop assertion when command in sequence fails.

## Unit Tests
- (pending) integration/cmd-resolution-precedence: verifies exact > wildcard precedence → supports AC#1 of story e7b6a902.
- (pending) integration/cmd-resolution-fallback: verifies legacy fallback when no pattern matches → supports AC#2 of story e7b6a902.
- (pending) integration/cmd-oncreate-sequence: verifies order and failure-stop behavior → supports AC#3, AC#4 of story e7b6a902.

## Expected Outcome
Command-level behavior is regression-protected for matching and execution semantics.

## Actual Outcome
Not started.

## Lessons Learned
Pending during execution.
