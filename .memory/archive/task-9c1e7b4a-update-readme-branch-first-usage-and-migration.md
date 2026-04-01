---
id: 9c1e7b4a
title: update-readme-branch-first-usage-and-migration
created_at: 2026-04-01T12:28:00+10:30
updated_at: 2026-04-01T19:45:00+10:30
status: completed
epic_id: b4e9d1a7
phase_id: phase-3-optional-generator-and-docs-hardening
story_id: d8c1f4a2
assigned_to: session-20260331-1918
---

# Task: Update README for branch-first usage and migration

## Objective
Document branch-first create usage, slug derivation defaults, and migration guidance for legacy behavior.

## Related Story
- Story: [story-d8c1f4a2-document-branch-first-ergonomics-and-migration](./story-d8c1f4a2-document-branch-first-ergonomics-and-migration.md)
- Acceptance criteria supported: AC#1, AC#2, AC#3.

## Related Phase
- Epic: [epic-b4e9d1a7-configurable-branch-naming-for-worktree-create](./epic-b4e9d1a7-configurable-branch-naming-for-worktree-create.md)
- Phase: Phase 3: Optional generator + docs hardening.

## Steps
- [x] Update primary usage examples to branch-first command contract.
- [x] Add concise explanation of `slugify(branch)` default naming.
- [x] Add migration notes for legacy `<feature-name>` expectation and warning/error policy.

## Expected Outcome
README clearly reflects the new branch-first UX and migration path.

## Actual Outcome
README now documents the branch-first contract as primary usage, shows `slugify(branch)` naming defaults, includes `--name` precedence examples, and adds explicit migration guidance for users coming from legacy `<feature-name>` expectations.

## Lessons
- Migration docs must show side-by-side old vs new behavior, not just a deprecation sentence.
- Quick-start command snippets can drift from implementation semantics unless tied to parser behavior and tests.
