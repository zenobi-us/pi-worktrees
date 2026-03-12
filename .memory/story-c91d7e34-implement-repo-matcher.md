---
id: c91d7e34
title: implement-repo-matcher
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-13T09:05:48+10:30
status: in-progress
epic_id: a7c9d4f2
priority: critical
story_points: 5
test_coverage: partial
---

# Story: Implement Git remote matcher

## User Story
As a user working across multiple repositories, I want my repo URL to resolve to the correct worktree settings so that setup behavior is context-specific and automatic.

## Acceptance Criteria
- [x] Repo URL normalization covers ssh/https forms.
- [x] Matcher evaluates patterns against the full git remote URL.
- [x] Selection precedence is deterministic: exact > most-specific glob.
- [x] Glob specificity uses segment-based specificity (not longest literal string).
- [ ] Tie on equal specificity produces a UI-visible conflict error (no silent winner); exact UX refinement is pending.
- [ ] Matching strategy is configurable via enum in config (future refinement item).
- [x] No-match behavior delegates to fallback.
- [ ] Story-level E2E verification is linked and passing for all criteria.

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
| AC1 | URL normalization works | Planned command-level resolver test | not-implemented |
| AC2 | Full remote URL targeting works | Planned command-level resolver test | not-implemented |
| AC3 | Deterministic precedence works | Planned precedence scenario test | not-implemented |
| AC4 | Segment-based specificity ranking works | Planned precedence scenario test | not-implemented |
| AC5 | Tie conflict surfaces UI error | Planned conflict scenario test | not-implemented |
| AC6 | Configurable strategy enum supported | Planned strategy-config test | not-implemented |
| AC7 | No-match fallback path works | Planned fallback scenario test | not-implemented |

### Unit Test Coverage (via Tasks)
- Task 1f2e3d4c: tie conflict fail-loud behavior → supports AC#5.
- Task 5a6b7c8d: configurable strategy enum behavior and validation → supports AC#6.

## Notes
- Glob behavior (case and separator handling) follows minimatch semantics/options.
- Tie-resolution behavior is intentionally fail-loud (UI error) until final strategy UX is refined.
