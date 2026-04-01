---
id: e3b7a1c9
title: branch-name-customization-options
created_at: 2026-03-31T19:10:00+10:30
updated_at: 2026-03-31T19:10:00+10:30
status: completed
epic_id: b4e9d1a7
---

# Research: Branch Name Customization Options

## Research Questions
- Which customization surfaces should branch naming support?
- What are the ergonomics and risks of each option?
- What precedence order produces predictable behavior?

## Summary
Three options were evaluated: CLI arg override, config template, and command-based generator. Recommended approach is hybrid precedence: `--branch` override first, then optional generator, then template, finally default fallback.

## Findings
- **CLI override (`/worktree create <name> --branch <branch>`):** best one-off ergonomics, low implementation risk, highly explicit.
- **Config template (`branchNameTemplate: "feat/{{name_slug}}"`):** best default ergonomics, deterministic/offline behavior, moderate implementation effort.
- **Command generator (`branchNameGenerator: "..."`):** maximum flexibility, highest risk (latency, nondeterminism, shell safety), should be opt-in only.
- **Recommended precedence:** CLI > generator > template > default (`feature/{{name_slug}}`).

## User-Led Discovery (verbatim)
- User: "next epic to plan: research how we can customise the branch name to use"
- User: "come up with some options with different ergonomics: 

- /worktree create arg? 
- config template ? { branchNameTemplate: \"feat/{{ name_slug }}\" } 
- stdout result of a command: { branchNameGenerator: \"pi -p 'generate a branch name for {{ name }}' --model lmstudio/qwen3b\" } 

not sure"

## References
- Codebase: `src/cmds/cmdCreate.ts` (current hardcoded branch `feature/${featureName}`).
- Codebase: `src/services/config/schema.ts` (no current branch naming fields).
- Codebase: `src/index.ts` help text and config examples.
