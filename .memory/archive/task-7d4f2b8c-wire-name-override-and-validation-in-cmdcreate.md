---
id: 7d4f2b8c
title: wire-name-override-and-validation-in-cmdcreate
created_at: 2026-04-01T12:28:00+10:30
updated_at: 2026-04-01T19:32:00+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-2-core-implementation-branch-first-and-slug-naming
story_id: 6d3b8c1f
assigned_to: session-20260331-1918
---

# Task: Wire `--name` override and validation in `cmdCreate`

## Objective
Integrate explicit `--name` parsing so user-provided worktree names override derived slugs and pass validation.

## Related Story
- Story: [story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override](./story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override.md)
- Acceptance criteria supported: AC#2, AC#4.

## Related Phase
- Epic: [epic-b4e9d1a7-configurable-branch-naming-for-worktree-create](./epic-b4e9d1a7-configurable-branch-naming-for-worktree-create.md)
- Phase: Phase 2: Core implementation (branch-first + slug naming).

## Steps
- [x] Parse `--name` from create command options with clear precedence.
- [x] Reuse or implement worktree-name validation guardrails.
- [x] Add integration tests for override success and invalid explicit name failures.

## Expected Outcome
`cmdCreate` applies explicit name overrides safely and consistently.
