---
id: b4e9d1a7
title: branch-first-create-command-and-derived-worktree-name
created_at: 2026-03-31T19:10:00+10:30
updated_at: 2026-04-01T20:15:00+10:30
status: completed
---

# Epic: Branch-first `/worktree create` with derived worktree name

## Vision/Goal
Make `/worktree create` branch-first: first argument is the branch to create, and worktree folder name is derived by slugifying that branch unless explicitly overridden.

## Success Criteria
- `/worktree create <branch>` treats the first arg as the branch source of truth.
- Worktree name defaults to `slugify(branch)`.
- Optional `--name <worktree-name>` allows explicit folder naming override.
- Branch and derived names are validated with clear errors.
- Backward-compatibility behavior is defined and documented.
- Tests cover branch-first parsing, slug derivation, collisions, and migration warnings.

## Stories
- [x] [story-2c7f1a9e-define-branch-first-command-contract-and-precedence](./story-2c7f1a9e-define-branch-first-command-contract-and-precedence.md)
- [x] [story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override](./story-6d3b8c1f-derive-worktree-name-from-branch-slug-with-override.md)
- [x] [story-9a4e2f7b-add-optional-branch-name-generator-command](./story-9a4e2f7b-add-optional-branch-name-generator-command.md)
- [x] [story-d8c1f4a2-document-branch-first-ergonomics-and-migration](./story-d8c1f4a2-document-branch-first-ergonomics-and-migration.md)

## Phases
### Phase 1: Contract and migration design
- **Status**: completed
- **Start Criteria**: Epic accepted.
- **End Criteria**: Branch-first contract, precedence, and migration behavior are locked.
- **Tasks**:
  - [x] [task-31b7f2c4-author-branch-first-behavior-matrix](./task-31b7f2c4-author-branch-first-behavior-matrix.md)
  - [x] [task-4e9a1d6b-spec-legacy-feature-name-compatibility-policy](./task-4e9a1d6b-spec-legacy-feature-name-compatibility-policy.md)
  - [x] [plan-c8f1a2d4-phase-1-contract-to-phase-2-touchpoints](./plan-c8f1a2d4-phase-1-contract-to-phase-2-touchpoints.md) (prepare-code-changes output)

### Phase 2: Core implementation (branch-first + slug naming)
- **Status**: completed
- **Start Criteria**: Phase 1 complete (met).
- **End Criteria**: Branch-first parser and slug-derived worktree naming implemented with tests.
- **Tasks**:
  - [x] [task-c5a9e3b1-implement-branch-slug-derivation-utility](./task-c5a9e3b1-implement-branch-slug-derivation-utility.md)
  - [x] [task-7d4f2b8c-wire-name-override-and-validation-in-cmdcreate](./task-7d4f2b8c-wire-name-override-and-validation-in-cmdcreate.md)
  - [x] [task-2e8c4a9d-add-collision-tests-for-derived-and-explicit-names](./task-2e8c4a9d-add-collision-tests-for-derived-and-explicit-names.md)

### Phase 3: Optional generator + docs hardening
- **Status**: completed
- **Start Criteria**: Phase 2 complete.
- **End Criteria**: Optional generator path is guarded, tested, and documented.
- **Tasks**:
  - [x] [task-9c1e7b4a-update-readme-branch-first-usage-and-migration](./task-9c1e7b4a-update-readme-branch-first-usage-and-migration.md)
  - [x] [task-5b2d8f3e-refresh-cli-help-examples-for-branch-first-flow](./task-5b2d8f3e-refresh-cli-help-examples-for-branch-first-flow.md)
  - [x] Add `branchNameGenerator` execution path with timeout + fallback.

## Dependencies
- `src/cmds/cmdCreate.ts`
- `src/services/config/schema.ts`
- `src/index.ts` help text and README

## Risks
- Breaking existing user expectation of `<feature-name>` semantics.
- Slug collisions across similarly shaped branch names.
- Generator command remains nondeterministic and should stay opt-in.

## Out of Scope
- Making AI generation default.
- Remote policy enforcement beyond local validation.
