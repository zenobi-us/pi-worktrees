---
id: 5b2d8f3e
title: refresh-cli-help-examples-for-branch-first-flow
created_at: 2026-04-01T12:28:00+10:30
updated_at: 2026-04-01T19:45:00+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-3-optional-generator-and-docs-hardening
story_id: d8c1f4a2
assigned_to: session-20260331-1918
---

# Task: Refresh CLI help examples for branch-first flow

## Objective
Align CLI help text in `src/index.ts` with branch-first create semantics and naming precedence.

## Related Story
- Story: [story-d8c1f4a2-document-branch-first-ergonomics-and-migration](./story-d8c1f4a2-document-branch-first-ergonomics-and-migration.md)
- Acceptance criteria supported: AC#4.

## Related Phase
- Epic: [epic-b4e9d1a7-configurable-branch-naming-for-worktree-create](./epic-b4e9d1a7-configurable-branch-naming-for-worktree-create.md)
- Phase: Phase 3: Optional generator + docs hardening.

## Steps
- [x] Update `/worktree create` help usage signature and examples.
- [x] Ensure help text states precedence: `--name` over derived slug.
- [x] Add or update migration-facing note for legacy users where appropriate.

## Expected Outcome
Help output matches implemented branch-first behavior and reduces migration confusion.

## Actual Outcome
`src/index.ts` help text now states branch-first usage, explicitly documents `--name` precedence over slugified defaults, and provides migration-safe command guidance for preserving old semantics.

## Lessons
- Help text must include precedence rules, not just argument signatures.
- Migration examples should be copy-pasteable to reduce user error during contract changes.
