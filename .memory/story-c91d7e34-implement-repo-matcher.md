---
id: c91d7e34
title: implement-repo-matcher
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-12T22:57:00+10:30
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
- [x] Matcher supports host/owner/repo and owner/repo targeting.
- [x] Selection is deterministic per precedence rules.
- [x] No-match behavior delegates to fallback.
- [ ] Story-level E2E verification is linked and passing for all criteria.

## Context
Matching is the core capability that enables per-repo configuration.

## Out of Scope
- Non-Git dimensions for matching (branch/path).

## Tasks
- No task files created for this story in memory.

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | URL normalization works | Planned command-level resolver test | not-implemented |
| AC2 | Candidate targets supported | Planned command-level resolver test | not-implemented |
| AC3 | Deterministic precedence | Planned precedence scenario test | not-implemented |
| AC4 | No-match fallback path | Planned fallback scenario test | not-implemented |

### Unit Test Coverage (via Tasks)
- Test linkage has not been formalized into task artifacts in `.memory/`.

## Notes
Matcher and resolver behavior is tied to config service and command dependency wiring.
