---
id: c5a9e3b1
title: implement-branch-slug-derivation-utility
created_at: 2026-04-01T12:28:00+10:30
updated_at: 2026-04-01T19:32:00+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-2-core-implementation-branch-first-and-slug-naming
story_id: 6d3b8c1f
assigned_to: session-20260331-1918
---

# Task: Implement branch slug derivation utility

## Objective
Implement deterministic branch-to-worktree slug derivation for default naming behavior.

## Related Story
- Story: [story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override](./story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override.md)
- Acceptance criteria supported: AC#1.

## Related Phase
- Epic: [epic-b4e9d1a7-configurable-branch-naming-for-worktree-create](./epic-b4e9d1a7-configurable-branch-naming-for-worktree-create.md)
- Phase: Phase 2: Core implementation (branch-first + slug naming).

## Steps
- [x] Define slug normalization rules for common branch patterns.
- [x] Implement pure utility function for branch slug derivation.
- [x] Add unit tests for deterministic output and invalid branch handling boundaries.

## Expected Outcome
A tested slug derivation utility used as the default worktree naming path.
