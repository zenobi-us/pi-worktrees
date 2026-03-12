---
id: 1f2e3d4c
title: implement-tie-conflict-ui-error
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: todo
epic_id: a7c9d4f2
phase_id: phase-2-validation-and-hardening
story_id: c91d7e34
assigned_to: jXiU4x3gLHioEGWjj2DH6W1i
---

# Task: Implement tie conflict UI error

## Objective
Implement fail-loud handling when multiple patterns have equal specificity so users get a clear, actionable conflict error.

## Related Story
- Story: [story-c91d7e34-implement-repo-matcher](./story-c91d7e34-implement-repo-matcher.md)
- Acceptance criteria supported: AC#5.

## Related Phase
- Epic: [epic-a7c9d4f2-multi-worktree-settings](./epic-a7c9d4f2-multi-worktree-settings.md)
- Phase: Phase 2: Validation and Hardening.

## Steps
- [ ] Identify tie-detection point in matcher resolution.
- [ ] Emit structured conflict error with competing patterns listed.
- [ ] Ensure command output surfaces the conflict visibly.
- [ ] Add/update tests for tie failure behavior.

## Unit Tests
- (pending) matcher tie conflict detection test: verifies ties fail loud with conflicting patterns listed → supports AC#5 of story c91d7e34.

## Expected Outcome
Tie scenarios no longer silently choose a winner; users receive a visible error with diagnostics.

## Actual Outcome
Not started.

## Lessons Learned
Pending during execution.
