# Project Constitution

Version: 1.0
Status: active
Last updated: 2026-03-12

## 1) Mission
Build reliable, maintainable Bun/TypeScript modules with clear APIs, strong tests, and predictable developer workflows.

## 2) Success Criteria
- Features solve real user needs and are documented.
- CI stays green (build, lint, tests).
- Changes are understandable by a new contributor within one session.
- Regressions are caught quickly through tests and review discipline.

## 3) Non-Negotiables
- Type safety over convenience (`strict` TypeScript remains enabled).
- Readability over cleverness (prefer simple control flow, early exits).
- No merging known failing build/lint/test states.
- No secrets or sensitive data committed.

## 4) Scope Boundaries
In scope:
- Bun-focused TypeScript modules.
- Incremental, test-backed feature and refactor work.

Out of scope (unless explicitly approved):
- Large rewrites without migration plan.
- Introducing heavy dependencies for minor gains.
- Architecture changes without written rationale.

## 5) Engineering Standards
- Follow repository standards in `AGENTS.md` (formatting, linting, import style, naming).
- Any non-trivial change should include or update tests.
- Public behavior changes require docs/changelog notes.
- Error handling must preserve context and avoid silent failure.

## 6) Decision Policy
For meaningful technical decisions, record:
- Context
- Options considered
- Decision made
- Consequences/tradeoffs

Decision quality bar:
- Prefer reversible decisions when uncertainty is high.
- Escalate high-impact, hard-to-reverse choices before implementation.

## 7) Workflow Rules
- Keep work visible in `.memory/todo.md` with owner/status/acceptance criteria.
- Limit active concurrent work to reduce thrash.
- “Done” means: implementation complete, tests updated/passing, and memory docs aligned.

## 8) Ownership
- Current session owner is responsible for execution quality and truthful status reporting.
- If ownership is unclear, stop and assign before major work.

## 9) Amendment Process
This constitution can change when:
1. A concrete pain point is identified,
2. A proposed amendment is written, and
3. The change is explicitly approved and recorded.

Amendments must include rationale and expected impact.
