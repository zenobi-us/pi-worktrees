---
id: 9e0f1a2b
title: author-migration-set-worktree-to-worktrees
created_at: 2026-03-13T09:05:48+10:30
updated_at: 2026-03-20T21:49:00+10:30
status: done
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
- [x] Define migration-set schema/version metadata.
- [x] Implement migration transform from legacy to plural shape.
- [x] Integrate migration execution in config load path.
- [x] Document migration/deprecation behavior aligned to framework policy.

## Unit Tests
- `tests/services/config.migrations.test.ts` (`is versioned and executable as an ordered migration set`): verifies migration set ordering and versioned execution metadata via preview result → supports AC#5 of story d3a54f18.
- `tests/services/config.migrations.test.ts` (`migrates legacy worktree shape to worktrees fallback pattern`): verifies `worktree` migrates to `worktrees["**"]` through migration execution → supports AC#4 of story d3a54f18.
- `tests/services/config.migrations.test.ts` (`keeps migration behavior policy-driven through framework validation`): verifies migration path remains framework-driven and parse-validated without extension-specific deprecation logic → supports AC#6 of story d3a54f18.

## Expected Outcome
Legacy users are migrated through shared migration infrastructure with versioned policy-driven behavior.

## Actual Outcome
Completed. Implemented a versioned migration set that transitions legacy flat/singular config to `worktrees`, integrated it into config loading, added migration-set tests, and documented policy-driven deprecation behavior.

### Verification Evidence
- `src/services/config/migrations/02-worktree-to-worktrees.ts`: adds migration `legacy-worktree-to-worktrees` to move legacy `worktree` settings into `worktrees["**"]`.
- `src/services/config/config.ts`: registers migration set `[migration_01, migration_02]` with `createConfigService(...)`.
- `tests/services/config.migrations.test.ts`: covers migration-set registration/versioning, transform behavior, and policy-aligned behavior.
- `README.md` migration note: documents migration chain and policy-driven deprecation behavior.
- `bun test tests/services/config.migrations.test.ts tests/services/config.loader.integration.test.ts`: pass (6/6).
- `bun test tests/services`: pass (11/11).

### Next Implementation Checkpoint
- [x] Define migration-set contract and version metadata.
- [x] Implement `worktree` -> `worktrees` transform within migration-set flow.
- [x] Add migration registration and behavior tests before moving to `in-progress`.

## Lessons Learned
Versioned migration chains keep compatibility transitions explicit and testable while avoiding extension-local deprecation side effects.
