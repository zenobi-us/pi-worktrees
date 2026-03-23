# Todo

## Active Epic: cli-only-separation-from-pi-mono

- [ ] [epic-e9f4a1c2-cli-only-separation-from-pi-mono](./epic-e9f4a1c2-cli-only-separation-from-pi-mono.md) — in-progress
  - [ ] Scope: replace `ui.notify` paths with `ConsoleDisplayPrinter` interaction service.
  - [x] Discovery: audit and document existing separation from pi coding agent internals — [research-c3f9a27e-cli-separation-audit-ui-dependencies](./research-c3f9a27e-cli-separation-audit-ui-dependencies.md)
  - [x] Discovery: research TypeScript CLI frameworks (Bun/Node.js) — [research-b7d9c4e1-typescript-cli-framework-options](./research-b7d9c4e1-typescript-cli-framework-options.md), decision accepted in [decision-f6a2b1d9-cli-framework-selection](./decision-f6a2b1d9-cli-framework-selection.md)
  - [ ] Next: run implementation spike for `@effect/cli` + `@effect/platform-bun` with one typed command and error envelope.
  - [x] Phase A: inventory `ui.notify` call sites and dependency edges per execution plan.
  - [ ] Next: define `ConsoleDisplayPrinter` service contract and method mapping table.

## Parked

- [ ] [epic-c6d8a1f4-expose-subcommands-as-tools](./epic-c6d8a1f4-expose-subcommands-as-tools.md) — cancelled
