---
id: e9f4a1c2
title: Convert project to CLI-only and decouple from pi-mono
created_at: 2026-03-23T18:20:43+10:30
updated_at: 2026-03-23T19:25:11+10:30
status: in-progress
---

# Convert project to CLI-only and decouple from pi-mono

## Vision/Goal
Move this project to a CLI-only architecture with no dependency direction toward pi-mono UI surfaces.

## Success Criteria
- Runtime paths are CLI-only and no longer rely on UI interaction primitives from pi-mono.
- `ui.notify` call sites are replaced by a dedicated console interaction service.
- A framework/runtime decision (Bun vs Node.js + framework) is documented with trade-offs and recommendation.

## Scope / Discovery Items
- [ ] **Scope item:** Replace `ui.notify` usage with a `ConsoleDisplayPrinter` service that can also support interactive prompts.
- [x] **Discovery item:** Validate and document how much of the current codebase is already separated from the pi coding agent internals.
- [x] **Discovery item:** Research TypeScript CLI frameworks suitable for Bun and/or Node.js.

## Stories
- [ ] Story S1: Define CLI-only interaction boundary and remove UI dependency surface.
- [ ] Story S2: Implement `ConsoleDisplayPrinter` abstraction and migration plan for current notification paths.
- [ ] Story S3: Select framework/tooling stack for CLI UX and command architecture.

## Phases

### Phase 1: Discovery and Decision Framing
- **Status**: in-progress
- **Start Criteria**: Epic approved
- **End Criteria**: Separation audit complete, CLI framework research documented, migration direction selected
- **Tasks**:
  - [x] Audit current code paths for `ui.notify` and adjacent interaction dependencies ([research-c3f9a27e-cli-separation-audit-ui-dependencies](./research-c3f9a27e-cli-separation-audit-ui-dependencies.md)).
  - [x] Produce CLI framework research artifact for Bun/Node.js options.
  - [x] Draft migration constraints and recommended target architecture ([decision-f6a2b1d9-cli-framework-selection](./decision-f6a2b1d9-cli-framework-selection.md)).
- **Notes**: Start with minimal disruption and preserve existing command semantics.
- **Decision**: `@effect/cli` + `@effect/platform-bun` selected for TypeScript-first CLI migration.
- **Audit evidence**: [research-c3f9a27e-cli-separation-audit-ui-dependencies](./research-c3f9a27e-cli-separation-audit-ui-dependencies.md).

### Phase 2: Interaction Layer Migration
- **Status**: planned
- **Start Criteria**: Phase 1 complete
- **End Criteria**: `ConsoleDisplayPrinter` integrated and legacy UI notifications removed from core flows
- **Tasks**: define service contract, implement adapters, migrate call sites, add tests.
- **Notes**: Keep interaction APIs explicit and testable.

### Phase 3: CLI-only Consolidation
- **Status**: planned
- **Start Criteria**: Phase 2 complete
- **End Criteria**: Documentation and command UX finalized for CLI-only operation
- **Tasks**: docs, migration notes, cleanup of obsolete UI references.
- **Notes**: Confirm no remaining dependency direction toward pi-mono surfaces.

## Dependencies
- Existing command architecture and service boundaries in this repository.
- Final framework/runtime decision from research findings.

## Overall Timeline
- Phase 1 immediate; Phase 2 and 3 follow after direction review.
- Execution plan: [plan-e9f4a1c2-cli-only-migration-execution](./plan-e9f4a1c2-cli-only-migration-execution.md)
