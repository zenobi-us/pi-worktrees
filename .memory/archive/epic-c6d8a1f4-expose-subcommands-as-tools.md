---
id: c6d8a1f4
title: Expose subcommands as tools
created_at: 2026-03-22T11:16:54+10:30
updated_at: 2026-03-23T18:33:58+10:30
status: cancelled
---

# Expose subcommands as tools

## Vision/Goal
Expose selected CLI subcommands as first-class tools so agents and users can call them directly without shell indirection.

## Success Criteria
- A clear mapping exists from each exposed subcommand to a tool surface.
- Tool invocation paths preserve current subcommand behavior and argument semantics.
- Error output and exit semantics are standardized for tool consumers.
- Documentation explains supported tools, usage constraints, and migration guidance.

## Stories
- [ ] [story-91ab4c2e-define-worktrees-tool-interface-and-dispatch](./story-91ab4c2e-define-worktrees-tool-interface-and-dispatch.md)
- [ ] [story-a6f3d9b1-implement-worktrees-tool-list-create-remove](./story-a6f3d9b1-implement-worktrees-tool-list-create-remove.md)
- [ ] [story-c24e7a8d-add-worktrees-tool-tests](./story-c24e7a8d-add-worktrees-tool-tests.md)
- [ ] [story-e1b5c7f9-document-worktrees-tool-usage](./story-e1b5c7f9-document-worktrees-tool-usage.md)

## Phases

### Phase 1: Discovery and Interface Design
- **Status**: cancelled
- **Start Criteria**: Epic approved
- **End Criteria**: Tool exposure surface and compatibility constraints are documented
- **Tasks**: capture Q&A decisions, define tool schema/dispatch contract, and finalize story backlog
- **Notes**: Enumerate candidate subcommands and define stable input/output contracts.

### Phase 2: Implementation
- **Status**: cancelled
- **Start Criteria**: Phase 1 complete
- **End Criteria**: Selected subcommands are callable as tools with tests
- **Tasks**: implement `worktrees` tool for `list/create/remove` and land test coverage
- **Notes**: Implement adapters, argument translation, and error handling.

### Phase 3: Validation and Rollout
- **Status**: cancelled
- **Start Criteria**: Phase 2 complete
- **End Criteria**: Documentation updated and rollout validated against existing workflows
- **Tasks**: publish docs and validate release readiness for big-bang rollout
- **Notes**: Backward compatibility is explicitly out of scope for this rollout.

## Dependencies
- Existing subcommand architecture and parser behavior.
- Tool registration/discovery mechanism in this repository.
- Test coverage for command behavior and tool wrappers.

## Overall Timeline
- Cancelled by user request; no further implementation planned under this epic.
