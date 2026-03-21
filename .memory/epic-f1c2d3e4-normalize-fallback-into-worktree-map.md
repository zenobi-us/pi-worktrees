---
id: f1c2d3e4
title: normalize-default-fallback-into-worktree-map-before-matching
created_at: 2026-03-21T22:36:02+10:30
updated_at: 2026-03-21T22:55:00+10:30
status: done
---

# Epic: Normalize default/fallback worktree settings into map before matching

## Vision/Goal
Move fallback handling out of `matchRepo` by normalizing default/fallback worktree settings into the worktree map before matching runs.

## Success Criteria
- Matching input always contains an explicit normalized fallback/default entry in the worktree map.
- `matchRepo` no longer performs fallback selection logic.
- Existing behavior for no-match scenarios remains unchanged from a user perspective.

## Stories
- [x] [story-a1b2c3d4-normalize-worktree-map-before-match](./story-a1b2c3d4-normalize-worktree-map-before-match.md)

## Phases
### Phase 1: Implementation
- **Status**: in-progress
- **Start Criteria**: Epic approved.
- **End Criteria**: Fallback normalization occurs pre-match and tests confirm no regression.
- **Tasks**:
  - [ ] [task-b7c8d9e0-normalize-fallback-into-map-pre-match](./task-b7c8d9e0-normalize-fallback-into-map-pre-match.md)

## Dependencies
- Repo matching implementation in `src/services/git.ts`.
- Config shaping/resolution path in `src/services/config/`.

## Risks
- Subtle regression in no-match behavior if normalization contract is inconsistent.

## Out of Scope
- New matching semantics or precedence changes beyond fallback location shift.

## Supporting conversation

### User question
User asked how default worktree settings are treated today, specifically whether effective config behaves like:

1. `worktrees = { 'reckon-limited/**': {}, '**': { ...from config.worktree } }`, or
2. `worktrees = { 'reckon-limited/**': {}, '**': { ...from DefaultWorktreeSettings } }`.

They also asked for a state-machine view of `matchRepo` data flow and what architecture would look like if fallback/defaults were normalized into the map *before* matching.

### Findings from code inspection

#### 1) What is loaded into the matcher input map
- `createPiWorktreeConfigService()` builds matcher input as:
  - `const worktrees = new Map(Object.entries(store.config.worktrees || {}));`
  - Source: `src/services/config/config.ts`.
- This means there is **no automatic map-time insertion** of `"**"` and **no map-time merge** with `DefaultWorktreeSettings`.

#### 2) Where defaults are currently applied
- `matchRepo()` returns `DefaultWorktreeSettings` only in two explicit branches:
  - when `!url || repos.size === 0` → result type `"default"`
  - when `scoredMatches.length === 0` → result type `"no-match"`
  - Source: `src/services/git.ts`.
- Therefore defaults are **resolution-time fallback**, not pre-normalized map content.

#### 3) Legacy `worktree` handling
- Legacy single-worktree config is migrated into `worktrees["**"]` by migration `02-worktree-to-worktrees`.
- Migration behavior:
  - if legacy `worktree` exists, merge into fallback pattern `"**"`
  - preserve existing explicit `worktrees` entries
  - merge with existing `worktrees["**"]` if present.
- Source: `src/services/config/migrations/02-worktree-to-worktrees.ts`.

#### 4) Per-entry default inheritance does not exist today
- There is no code path doing `effectiveSettings = { ...DefaultWorktreeSettings, ...matchedSettings }` per matched entry.
- Result: if a specific pattern matches and omits fields, omitted fields are not filled from `DefaultWorktreeSettings`.

### Behavioral summary (current)
- If migrated legacy fallback exists (`"**"`), that pattern can match and produce `type: "exact"` with `matchedPattern: "**"`.
- If no pattern matches and no `"**"` fallback entry exists, matcher returns `type: "no-match"` with `settings: DefaultWorktreeSettings`.
- If URL missing or map empty, matcher returns `type: "default"` with `settings: DefaultWorktreeSettings`.

### Match flow state machine captured in conversation
`matchRepo` flow discussed and documented as:
1. Guard: missing URL or empty map → `default` + `DefaultWorktreeSettings`.
2. Normalize URL and iterate patterns.
3. Exact normalized match short-circuits to `exact`.
4. Else collect glob matches + specificity.
5. No glob matches → `no-match` + `DefaultWorktreeSettings`.
6. One best specificity → `exact` winner.
7. Tie on top specificity → `resolveTie`:
   - `fail-on-tie` → `tie-conflict`
   - `first-wins` → strategy result with first pattern
   - `last-wins` → strategy result with last pattern.

### “Normalize before match” alternative discussed
Proposed pre-normalization shape:
- Seed `worktrees["**"]` from `DefaultWorktreeSettings`.
- Overlay legacy single `worktree` into `worktrees["**"]` (if present).
- Overlay file `worktrees` entries last (including optional explicit `"**"` override).

Conceptually:
- `normalized = merge(default fallback) -> merge(legacy fallback) -> merge(config.worktrees)`

### Predicted deltas if implemented
- Unmatched repos would usually resolve via explicit `"**"` pattern (often `type: "exact"`, `matchedPattern: "**"`) instead of `type: "no-match"`.
- `matchRepo` could drop internal fallback-return branches (or reduce them to pure safety guards).
- If only fallback normalization is added (without per-entry default merges), specific pattern partials stay semantically as-is.
- If per-entry merge is also introduced, semantics change materially (specific patterns inherit missing fields from defaults), which is **not** current behavior.

### Net clarification provided to user
- Between the two candidate mental models, current runtime behavior is:
  - **Legacy migration may create `worktrees["**"]` from `config.worktree`.**
  - **`DefaultWorktreeSettings` is not injected into `config.worktrees`; it is applied by `matchRepo` only in fallback branches.**