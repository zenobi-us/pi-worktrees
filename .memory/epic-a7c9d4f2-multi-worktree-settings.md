---
id: a7c9d4f2
title: convert-settings-from-single-to-multiple-worktree-settings-by-git-url-pattern
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: in-progress
---

# Epic: Convert Settings from Single to Multiple Worktree Settings by Git URL Pattern

## Vision/Goal
Current settings are centered on a single worktree configuration. This epic introduces multi-worktree configuration selection based on Git repository URL patterns.

## Success Criteria
- Settings schema supports `worktrees: Record<Pattern, WorktreeSettings>` with `onCreate: string | string[]`.
- Pattern matching resolves the correct config based on repository URL.
- Existing single-worktree settings are migrated or compatibility-handled.
- Conflict behavior is deterministic and documented.
- Tests cover match behavior, fallback behavior, and compatibility behavior.
- Docs include the new structure and migration guidance.

## Stories
- [x] [story-4f1a2b9c-audit-single-settings-surface](./story-4f1a2b9c-audit-single-settings-surface.md)
- [x] [story-8ac3d1e7-spec-pattern-matching-semantics](./story-8ac3d1e7-spec-pattern-matching-semantics.md)
- [ ] [story-b2e9f0aa-implement-schema-loader-updates](./story-b2e9f0aa-implement-schema-loader-updates.md)
- [ ] [story-c91d7e34-implement-repo-matcher](./story-c91d7e34-implement-repo-matcher.md)
- [ ] [story-d3a54f18-add-compat-migration-bridge](./story-d3a54f18-add-compat-migration-bridge.md)
- [ ] [story-e7b6a902-add-matching-tests](./story-e7b6a902-add-matching-tests.md)
- [x] [story-f4cd219b-update-docs-and-help](./story-f4cd219b-update-docs-and-help.md)

## Phases
### Phase 1: Story Definition
- **Status**: completed
- **Start Criteria**: Epic approved.
- **End Criteria**: Story files contain user-story framing, acceptance criteria, and test specifications.
- **Tasks**:
  - [x] Define and fill story artifacts in `.memory/story-*.md`.
- **Notes**: Story details are maintained in dedicated story files, not duplicated in this epic.

### Phase 2: Validation and Hardening
- **Status**: in-progress
- **Start Criteria**: Story set established.
- **End Criteria**: Command-level integration tests and story test-coverage gates completed.
- **Tasks**:
  - [ ] [task-b2c3d4e5-add-schema-loader-integration-tests](./task-b2c3d4e5-add-schema-loader-integration-tests.md)
  - [ ] [task-1f2e3d4c-implement-tie-conflict-ui-error](./task-1f2e3d4c-implement-tie-conflict-ui-error.md)
  - [ ] [task-5a6b7c8d-add-matching-strategy-enum](./task-5a6b7c8d-add-matching-strategy-enum.md)
  - [ ] [task-9e0f1a2b-author-migration-set-worktree-to-worktrees](./task-9e0f1a2b-author-migration-set-worktree-to-worktrees.md)
  - [ ] [task-3c4d5e6f-add-command-level-resolution-integration-tests](./task-3c4d5e6f-add-command-level-resolution-integration-tests.md)
  - [ ] [task-7a8b9c0d-add-config-service-integration-coverage](./task-7a8b9c0d-add-config-service-integration-coverage.md)
  - [ ] Promote in-progress stories to completed once `test_coverage: full` gate is satisfied.

## Dependencies
- Settings schema/parser in `src/services/config.ts`.
- Runtime command wiring in `src/index.ts`.
- Documentation in `README.md` and command help text.

## Risks
- Ambiguous pattern precedence causing surprising configuration selection.
- Backward compatibility regressions for existing single-setting users.

## Out of Scope
- New templating variables beyond existing placeholders.
- Non-Git matching dimensions (branch name, local path, etc.).
