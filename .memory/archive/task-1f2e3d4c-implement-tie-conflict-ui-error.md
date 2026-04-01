---
id: 1f2e3d4c
title: implement-tie-conflict-ui-error
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-20T10:22:00+10:30
status: done
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
- [x] Identify tie-detection point in matcher resolution.
- [x] Emit structured conflict error with competing patterns listed.
- [x] Ensure command output surfaces the conflict visibly.
- [x] Add/update tests for tie failure behavior.

## Unit Tests
- `tests/services/git.matcher.test.ts` `returns tie-conflict by default (fail-on-tie) with actionable details`: verifies ties fail loud with conflicting patterns listed → supports AC#5 of story c91d7e34.

## Expected Outcome
Tie scenarios no longer silently choose a winner; users receive a visible error with diagnostics.

## Actual Outcome
Completed. Tie conflict messages are now propagated as actionable errors and surfaced through command error notifications. Tie behavior is covered by automated tests.

### Verification Evidence
- `src/services/git.ts`: tie conflicts are detected and produced with structured details (`type: 'tie-conflict'`, `patterns`, `message`).
- `src/services/git.ts`: parent-dir resolution now throws tie conflict message (`throw new Error(worktree.message)`).
- `src/index.ts`: command handler wraps reload/current/command execution in `try/catch` and surfaces failures via `ctx.ui.notify(...)`.

### Next Implementation Checkpoint
- [x] Replace blank throw with surfaced actionable conflict message at command boundary.
- [x] Add matcher tests for `fail-on-tie`, `first-wins`, and `last-wins` outcomes.
- [x] Reclassify this task to `done` only after tests exist and pass.

## Lessons Learned
Tie behavior should be surfaced at command boundary, not left to generic uncaught error flows.
