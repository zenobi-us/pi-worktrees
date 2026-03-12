---
id: 8ac3d1e7
title: spec-pattern-matching-semantics
created_at: 2026-03-12T00:00:00+10:30
updated_at: 2026-03-12T22:50:00+10:30
status: completed
epic_id: a7c9d4f2
priority: high
story_points: 3
test_coverage: full
---

# Story: Specify pattern matching semantics

## User Story
As a maintainer, I want deterministic pattern-matching semantics so that each repository resolves to the expected worktree settings without ambiguity.

## Acceptance Criteria
- [x] Wildcard behavior (`*`) is defined.
- [x] Match target normalization is defined (canonical repo identifier).
- [x] Precedence is defined: exact > most specific wildcard > declaration order.
- [x] No-match fallback behavior is defined.
- [x] `onCreate` string/array normalization and execution rules are defined.

## Context
Without a clear spec, matcher behavior risks becoming implementation-defined and inconsistent.

## Out of Scope
- Code implementation of matcher.
- Full migration implementation.

## Tasks
- No task files created for this story in memory.

## Test Specification
### E2E Tests
| AC# | Criterion | Test file/case | Status |
|---|---|---|---|
| AC1 | Wildcard behavior defined | Spec review checklist | passing |
| AC2 | Match target normalization defined | Spec review checklist | passing |
| AC3 | Precedence ordering defined | Spec review checklist | passing |
| AC4 | Fallback behavior defined | Spec review checklist | passing |
| AC5 | onCreate normalization/execution defined | Spec review checklist | passing |

### Unit Test Coverage (via Tasks)
- Task linkage not yet recorded in memory task files; implementation stories reference this spec.

## Notes
Specification captured:
- `*` matches any sequence.
- Matching target is canonical host/owner/repo identifier.
- Deterministic precedence and tie-break behavior.
- Fallback to legacy singular `worktree` when no `worktrees` pattern matches.
- Runtime normalization of `onCreate` to ordered command list.
