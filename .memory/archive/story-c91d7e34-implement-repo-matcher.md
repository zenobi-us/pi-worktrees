---
id: c91d7e34
title: implement-repo-matcher
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-20T22:31:00+10:30
status: done
epic_id: a7c9d4f2
priority: critical
story_points: 5
test_coverage: full
---

# Story: Implement Git remote matcher

## User Story
As a user working across multiple repositories, I want my repo URL to resolve to the correct worktree settings so that setup behavior is context-specific and automatic.

## Acceptance Criteria
- [x] Repo URL normalization covers ssh/https forms.
- [x] Matcher evaluates patterns against the full git remote URL.
- [x] Selection precedence is deterministic: exact > most-specific glob.
- [x] Glob specificity uses segment-based specificity (not longest literal string).
- [x] Tie on equal specificity produces a UI-visible conflict error (no silent winner).
- [x] Matching strategy is configurable via enum in config (`fail-on-tie` | `first-wins` | `last-wins`).
- [x] No-match behavior delegates to fallback.
- [x] Story-level E2E verification is linked and passing for all criteria.

## Context
Matching is the core capability that enables per-repo configuration.

## Out of Scope
- Non-Git dimensions for matching (branch/path).

## Tasks
- [task-1f2e3d4c-implement-tie-conflict-ui-error](./task-1f2e3d4c-implement-tie-conflict-ui-error.md)
- [task-5a6b7c8d-add-matching-strategy-enum](./task-5a6b7c8d-add-matching-strategy-enum.md)

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | URL normalization works | `tests/services/git.matcher.test.ts` (`normalizes ssh/https forms to the same repo target`) | passing |
| AC2 | Full remote URL targeting works | `tests/cmds/cmd.resolution.integration.test.ts` + `tests/services/config.service.integration.test.ts` (https URL resolution path) | passing |
| AC3 | Deterministic precedence works | `tests/cmds/cmd.resolution.integration.test.ts` (`uses exact match over wildcard settings when creating a worktree`) | passing |
| AC4 | Segment-based specificity ranking works | `tests/services/git.matcher.test.ts` (`uses segment-based specificity for glob ranking`) | passing |
| AC5 | Tie conflict surfaces UI error | `tests/services/git.matcher.test.ts` (`returns tie-conflict by default (fail-on-tie) with actionable details`) | passing |
| AC6 | Configurable strategy enum supported | `tests/services/git.matcher.test.ts` + `tests/services/config.schema.test.ts` | passing |
| AC7 | No-match fallback path works | `tests/cmds/cmd.resolution.integration.test.ts` + `tests/services/config.service.integration.test.ts` | passing |

### Unit Test Coverage (via Tasks)
- Task 1f2e3d4c: tie conflict fail-loud behavior → supports AC#5.
- Task 5a6b7c8d: configurable strategy enum behavior and validation → supports AC#6.

## Verification Evidence
- `src/services/git.ts`: normalization, glob specificity scoring, deterministic precedence, and tie result generation are implemented.
- `src/services/config/schema.ts`: `matchingStrategy` enum is defined.
- `src/services/config/config.ts`: strategy is persisted and passed to matcher calls.
- `src/services/git.ts`: parent-dir resolution now throws actionable tie-conflict message.
- `src/index.ts`: command execution now catches and surfaces failures through `ctx.ui.notify(...)`.
- `tests/services/git.matcher.test.ts`: verifies fail-on-tie conflict details plus `first-wins` / `last-wins` deterministic behavior.
- `tests/services/config.schema.test.ts`: verifies `matchingStrategy` enum accepts valid values and rejects invalid values.
- `tests/services/git.matcher.test.ts`: now also verifies ssh/https normalization and explicit segment-based specificity ranking behavior.
- `bun test tests/services/git.matcher.test.ts tests/services/config.migrations.test.ts`: pass (9/9).
- `bun test tests`: full suite pass (21/21).

## Next Story Checkpoint
- [x] Complete task `5a6b7c8d` by adding schema enum validation test coverage.
- [x] Add dedicated matcher tests for AC#1 (ssh/https normalization) and AC#4 (segment-specific specificity ranking), then re-evaluate story completion.

## Notes
- Glob behavior (case and separator handling) follows minimatch semantics/options.
- Tie-resolution behavior is intentionally fail-loud (UI error) until final strategy UX is refined.
