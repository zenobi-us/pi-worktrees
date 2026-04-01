---
id: 4f1a2b9c
title: audit-single-settings-surface
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-12T22:50:00+10:30
status: completed
epic_id: a7c9d4f2
priority: high
story_points: 2
test_coverage: full
---

# Story: Audit single-settings surface

## User Story
As a maintainer, I want a complete inventory of single-worktree assumptions so that migration to pattern-based multi-worktree settings is safe and scoped.

## Acceptance Criteria
- [x] All schema assumptions tied to singular `worktree` settings are documented.
- [x] All runtime callsites consuming singular settings are documented.
- [x] User-facing docs/help text references to singular settings are documented.

## Context
This story establishes migration safety by making hidden coupling visible before implementation changes.

## Out of Scope
- Implementing schema changes.
- Implementing matching logic.

## Tasks
- No task files created for this story in memory.

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Schema assumptions documented | Manual review of inventory notes | passing |
| AC2 | Runtime callsites documented | Manual review of inventory notes | passing |
| AC3 | Docs/help references documented | Manual review of inventory notes | passing |

### Unit Test Coverage (via Tasks)
- No code task linked for this audit story; verification is document-review based.

## Notes
Inventory identified:
- `src/services/config.ts` singular schema and legacy flat compatibility.
- `src/index.ts` dependency injection from singular settings surface.
- `src/cmds/shared.ts`, `src/cmds/cmdInit.ts`, `src/cmds/cmdSettings.ts` singular `onCreate` assumptions.
- README/help text singular examples.
