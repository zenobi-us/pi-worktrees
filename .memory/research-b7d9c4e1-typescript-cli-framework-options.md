---
id: b7d9c4e1
title: TypeScript CLI framework options for CLI-only migration
created_at: 2026-03-23T18:20:43+10:30
updated_at: 2026-03-23T18:20:43+10:30
status: completed
epic_id: e9f4a1c2
---

# TypeScript CLI framework options for CLI-only migration

## Research Questions
- Which TypeScript-friendly CLI frameworks are strongest fits for a CLI-only migration?
- Which options align best with Bun and/or Node.js runtime flexibility?
- Which option balances extensibility, maintainability, and migration speed for this codebase?

## Summary
Three strong options surfaced: **oclif** (full framework), **Commander.js** (mature parser/framework-lite), and **citty/cac** (lightweight modern builders). For this migration, the practical shortlist is:
1) Commander.js for lowest migration friction and broad ecosystem familiarity,
2) oclif if plugin architecture and large multi-command growth are primary priorities,
3) citty/cac if minimal footprint and fast startup are prioritized.

## Findings

### 1) oclif
- Positioning: full CLI framework with plugin model and subcommand architecture.
- Strengths: extensibility, command scaffolding, large real-world usage.
- Risks: heavier framework shape than parser-first libraries.
- Fit: best when long-term plugin ecosystem and large command surface are expected.

### 2) Commander.js
- Positioning: comprehensive Node.js CLI solution with strict parsing and help system.
- Strengths: mature, predictable, broad adoption, TypeScript support.
- Risks: less opinionated project structure than full frameworks (you design architecture discipline yourself).
- Fit: best default for incremental migration from existing command code with minimal rewrite cost.

### 3) citty and cac
- Positioning: lightweight, TypeScript-friendly CLI builders.
- Strengths: low overhead, simple APIs, good for modern lightweight CLIs.
- Risks: less “batteries included” governance compared with oclif.
- Fit: strong option if startup speed and small dependency profile are top priorities.

### Recommendation
- Immediate migration track: **Commander.js** (or retain current parser if equivalent) plus a dedicated interaction adapter (`ConsoleDisplayPrinter`).
- Escalation trigger: move to **oclif** only if plugin/distribution complexity expands beyond current scope.

## References
- oclif official site: https://oclif.io/ — framework positioning, TypeScript/Node focus, plugin architecture. [credibility: 9/10, official project source]
- Commander.js README: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md — feature set, TypeScript support notes, strict parsing behavior. [credibility: 9/10, upstream maintainer repository]
- citty README: https://raw.githubusercontent.com/unjs/citty/main/README.md — zero-dependency and command model details. [credibility: 8/10, upstream maintainer repository]
- cac README: https://raw.githubusercontent.com/cacjs/cac/main/README.md — lightweight API and feature profile. [credibility: 8/10, upstream maintainer repository]
