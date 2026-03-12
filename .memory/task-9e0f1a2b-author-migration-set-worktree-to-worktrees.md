---
id: 9e0f1a2b
title: author-migration-set-worktree-to-worktrees
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: todo
epic_id: a7c9d4f2
phase_id: phase-2-validation-and-hardening
story_id: d3a54f18
assigned_to: jXiU4x3gLHioEGWjj2DH6W1i
---

# Task: Author migration set worktree->worktrees

## Objective
Implement and version migration-set support in `pi-extension-config` for transitioning from legacy `worktree` shape to `worktrees`.

## Related Story
- Story: [story-d3a54f18-add-compat-migration-bridge](./story-d3a54f18-add-compat-migration-bridge.md)
- Acceptance criteria supported: AC#4, AC#5, AC#6.

## Related Phase
- Epic: [epic-a7c9d4f2-multi-worktree-settings](./epic-a7c9d4f2-multi-worktree-settings.md)
- Phase: Phase 2: Validation and Hardening.

## Steps
- [ ] Define migration-set schema/version metadata.
- [ ] Implement migration transform from legacy to plural shape.
- [ ] Integrate migration execution in config load path.
- [ ] Document migration/deprecation behavior aligned to framework policy.

## Unit Tests
- (pending) migration-set-registration test: verifies migration set exists and version metadata is valid → supports AC#5 of story d3a54f18.
- (pending) migration-transform test: verifies legacy input migrates to new shape correctly → supports AC#4 of story d3a54f18.
- (pending) migration-policy behavior test: verifies deprecation behavior follows policy → supports AC#6 of story d3a54f18.

## Expected Outcome
Legacy users are migrated through shared migration infrastructure with versioned policy-driven behavior.

## Actual Outcome
Not started.

## Lessons Learned
Pending during execution.
