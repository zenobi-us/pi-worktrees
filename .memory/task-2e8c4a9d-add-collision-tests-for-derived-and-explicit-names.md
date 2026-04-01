---
id: 2e8c4a9d
title: add-collision-tests-for-derived-and-explicit-names
created_at: 2026-04-01T12:28:00+10:30
updated_at: 2026-04-01T19:32:00+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-2-core-implementation-branch-first-and-slug-naming
story_id: 6d3b8c1f
assigned_to: session-20260331-1918
---

# Task: Add collision tests for derived and explicit names

## Objective
Ensure collisions are detected and surfaced clearly for both slug-derived and explicitly overridden worktree names.

## Related Story
- Story: [story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override](./story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override.md)
- Acceptance criteria supported: AC#3.

## Related Phase
- Epic: [epic-b4e9d1a7-configurable-branch-naming-for-worktree-create](./epic-b4e9d1a7-configurable-branch-naming-for-worktree-create.md)
- Phase: Phase 2: Core implementation (branch-first + slug naming).

## Steps
- [x] Add integration test for derived slug collision.
- [x] Add integration test for explicit `--name` collision.
- [x] Standardize expected collision error messaging assertions.

## Expected Outcome
Collision behavior is deterministic and test-protected across naming paths.
