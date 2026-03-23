# Project Summary

## Current State
- Status: in-progress
- Current epic: [epic-e9f4a1c2-cli-only-separation-from-pi-mono](./epic-e9f4a1c2-cli-only-separation-from-pi-mono.md)
- Active phase: phase-1-discovery-and-decision-framing (in-progress)
- Next milestone: define `ConsoleDisplayPrinter` contract + mapping table from current `ctx.ui.*` usage.

## Notes
- New epic created for CLI-only conversion with explicit decoupling from pi-mono.
- Scope/discovery captured explicitly in epic for:
  - `ui.notify` replacement via `ConsoleDisplayPrinter`
  - separation audit of pi coding agent dependencies
  - CLI framework research for Bun/Node.js
- Research artifact completed: [research-b7d9c4e1-typescript-cli-framework-options](./research-b7d9c4e1-typescript-cli-framework-options.md)
- Decision accepted: [decision-f6a2b1d9-cli-framework-selection](./decision-f6a2b1d9-cli-framework-selection.md) selects `@effect/cli` + `@effect/platform-bun` for TypeScript-first needs.
- Execution plan created: [plan-e9f4a1c2-cli-only-migration-execution](./plan-e9f4a1c2-cli-only-migration-execution.md).
- Separation audit completed: [research-c3f9a27e-cli-separation-audit-ui-dependencies](./research-c3f9a27e-cli-separation-audit-ui-dependencies.md).
- Previous active epic (`epic-c6d8a1f4-expose-subcommands-as-tools`) is now cancelled per user request.
