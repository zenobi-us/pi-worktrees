---
id: f4cd219b
title: update-docs-and-help
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-12T22:50:00+10:30
status: completed
epic_id: a7c9d4f2
priority: medium
story_points: 2
test_coverage: full
---

# Story: Update docs and command help

## User Story
As a user, I want docs and command help to reflect the new configuration model so that I can configure multi-worktree behavior correctly.

## Acceptance Criteria
- [x] README documents `worktrees` shape and examples.
- [x] Help text reflects expected keys/types.
- [x] Migration notes from singular to plural settings are included.

## Context
Documentation is part of product behavior for CLI/config-driven tools.

## Out of Scope
- Non-config documentation improvements.

## Tasks
- No task files created for this story in memory.

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | README covers worktrees examples | Documentation review checklist | passing |
| AC2 | Help text reflects new shape | Command help review checklist | passing |
| AC3 | Migration guidance present | Documentation review checklist | passing |

### Unit Test Coverage (via Tasks)
- Not applicable; documentation story validated by content review.

## Notes
Primary evidence sources: `README.md`, command help block in `src/index.ts`.
