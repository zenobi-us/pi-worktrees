---
id: b7c8d9e0
title: normalize-fallback-into-map-pre-match
created_at: 2026-03-21T22:36:02+10:30
updated_at: 2026-03-21T22:55:00+10:30
status: done
epic_id: f1c2d3e4
phase_id: phase-1-implementation
story_id: a1b2c3d4
assigned_to: yZ1oQFmhO0whbPeq2sTGhc1C
---

# Task: Normalize fallback/default settings into worktree map pre-match

## Objective
Ensure fallback/default worktree settings are materialized into the worktree map before matcher invocation, then simplify `matchRepo` to matching-only behavior.

## Related Story
- Story: [story-a1b2c3d4-normalize-worktree-map-before-match](./story-a1b2c3d4-normalize-worktree-map-before-match.md)
- Acceptance criteria supported: AC#1, AC#2, AC#3.

## Related Phase
- Epic: [epic-f1c2d3e4-normalize-fallback-into-worktree-map](./epic-f1c2d3e4-normalize-fallback-into-worktree-map.md)
- Phase: Phase 1: Implementation.

## Steps
- [x] Add/adjust normalization in config resolution path to guarantee fallback/default entry exists before matcher call.
- [x] Remove fallback handling from `matchRepo`, keeping deterministic matching behavior intact.
- [x] Update/add tests for pre-match normalization and no-regression fallback behavior.

## Expected Outcome
Fallback behavior is preserved, but ownership is moved out of `matchRepo` into pre-match map normalization.

