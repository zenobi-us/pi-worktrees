---
id: f6a2b1d9
title: CLI framework selection for CLI-only migration
created_at: 2026-03-23T19:03:27+10:30
updated_at: 2026-03-23T19:03:27+10:30
status: accepted
epic_id: e9f4a1c2
---

# Decision: CLI framework selection for CLI-only migration

## Context
The active epic requires a framework/runtime direction for a CLI-only architecture with strong TypeScript guarantees and no pi-mono UI dependency direction.

Primary user constraint: **TypeScript is a primary concern**.

Candidate options considered in depth:
- `@effect/cli` (+ `@effect/platform-bun`)
- Commander.js

Supporting research artifact:
- [research-b7d9c4e1-typescript-cli-framework-options](./research-b7d9c4e1-typescript-cli-framework-options.md)

## Decision
Adopt **`@effect/cli` on Bun** using **`@effect/platform-bun`** as the primary CLI stack for this migration.

## Why this decision
- Best type-level rigor among shortlisted options for command contracts and error modeling.
- Aligns with the requirement to harden TypeScript guarantees across interaction boundaries.
- Supports Bun runtime via official Effect platform package (`@effect/platform-bun`).

## Trade-offs accepted
- Higher onboarding complexity (Effect runtime/layers/services).
- Migration complexity is greater than Commander.js.
- Team must enforce architecture discipline to avoid mixed paradigms.

## Rejected alternative (for now)
**Commander.js** remains a fallback if migration cost or team load proves too high.

Reason not selected now: lower type-modeling rigor relative to Effect approach, which conflicts with current priority.

## Implementation guardrails
- Define `ConsoleDisplayPrinter` as an explicit service boundary first.
- Keep CLI command modules pure and typed; isolate runtime effects behind services.
- Avoid partial/dual abstractions (no mixed ad-hoc imperative + Effect service drift).

## Validation checkpoints
- [ ] Create a minimal spike command with `@effect/cli` + `@effect/platform-bun` and verify Bun runtime execution.
- [ ] Validate typed argument parsing and typed error envelope for one command path.
- [ ] Confirm `ConsoleDisplayPrinter` service contract works in non-interactive and interactive modes.

## Consequences
This increases implementation complexity early, but should reduce long-term type drift and contract ambiguity in a CLI-first architecture.
