---
id: b7d9c4e1
title: TypeScript CLI framework options for CLI-only migration
created_at: 2026-03-23T18:20:43+10:30
updated_at: 2026-03-23T18:59:07+10:30
status: completed
epic_id: e9f4a1c2
---

# TypeScript CLI framework options for CLI-only migration

## Research Questions
- Which TypeScript-friendly CLI frameworks are strongest fits for a CLI-only migration?
- Which options align best with Bun and/or Node.js runtime flexibility?
- Which option balances extensibility, maintainability, and migration speed for this codebase?

## Summary
Five strong options surfaced: **oclif** (full framework), **Commander.js** (mature parser/framework-lite), **citty/cac** (lightweight modern builders), **@effect/cli** (typed FP-style framework in the Effect ecosystem), and **CrustJS** (Bun-native modular CLI framework, currently alpha).

For this migration, the practical shortlist is still:
1) Commander.js for lowest migration friction and broad ecosystem familiarity,
2) oclif if plugin architecture and large multi-command growth are primary priorities,
3) citty/cac if minimal footprint and fast startup are prioritized.

`@effect/cli` is compelling when the codebase already uses Effect-style architecture; CrustJS is promising for Bun-first projects but currently has earlier-stage adoption risk.

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

### 4) @effect/cli
- Summary: TypeScript CLI framework from the Effect project, with command composition, built-in help/completions/wizard mode, and platform integrations via `@effect/platform-*` packages.
- Strengths: strong type-level modeling, compositional command model, and good fit if the application already uses Effect runtime/layers.
- Weaknesses/Risks: introduces Effect ecosystem concepts (runtime, layers, services), increasing migration and onboarding complexity for non-Effect codebases.
- Bun/Node fit: explicit Node path via `@effect/platform-node` and Bun path via `@effect/platform-bun`; cross-runtime story is good when you accept Effect platform abstractions.
- Adoption signal: npm last-week downloads are high for `@effect/cli` (~91k/week at time of research), and the parent Effect repo has substantial GitHub adoption (~13.6k stars).

### 5) CrustJS
- Summary: TypeScript-first, Bun-native modular CLI framework (`@crustjs/*` packages) focused on composability and a fluent API.
- Strengths: Bun-native orientation, modular package split (`core`, `plugins`, prompts/style/store/etc.), and straightforward scaffolding (`bun create crust ...`).
- Weaknesses/Risks: publicly marked alpha, smaller ecosystem, and fewer known production users; higher framework maturity risk.
- Bun/Node fit: excellent for Bun-first projects; Node fit is not positioned as a primary target in official messaging, so portability risk is higher than Node-first frameworks.
- Adoption signal: early-stage usage (e.g., `@crustjs/core` ~251 npm downloads/week at time of research) and smaller GitHub footprint (~303 stars), indicating momentum but not yet mainstream adoption.

### Recommendation
- Immediate migration track: **Commander.js** (or retain current parser if equivalent) plus a dedicated interaction adapter (`ConsoleDisplayPrinter`).
- Escalation trigger: move to **oclif** only if plugin/distribution complexity expands beyond current scope.
- Conditional alternatives:
  - choose **@effect/cli** only if you want to standardize on Effect patterns across the app,
  - choose **CrustJS** only if Bun-native DX is a higher priority than ecosystem maturity.

## References
- oclif official site: https://oclif.io/ — framework positioning, TypeScript/Node focus, plugin architecture. [credibility: 9/10, official project source]
- Commander.js README: https://raw.githubusercontent.com/tj/commander.js/master/Readme.md — feature set, TypeScript support notes, strict parsing behavior. [credibility: 9/10, upstream maintainer repository]
- citty README: https://raw.githubusercontent.com/unjs/citty/main/README.md — zero-dependency and command model details. [credibility: 8/10, upstream maintainer repository]
- cac README: https://raw.githubusercontent.com/cacjs/cac/main/README.md — lightweight API and feature profile. [credibility: 8/10, upstream maintainer repository]
- npm package page (`@effect/cli`): https://www.npmjs.com/package/@effect/cli — package positioning/version metadata. [credibility: 9/10, npm registry]
- Effect CLI README (upstream): https://raw.githubusercontent.com/Effect-TS/effect/main/packages/cli/README.md — install/runtime integration (`@effect/platform-node`), built-in CLI options, platform abstraction model. [credibility: 9/10, upstream project docs]
- npm metadata (`@effect/platform-bun`): https://www.npmjs.com/package/@effect/platform-bun — Bun runtime package existence and description. [credibility: 9/10, npm registry]
- CrustJS site: https://crustjs.com/ — Bun-native positioning, alpha status, package/module catalog. [credibility: 8/10, official project source]
- Crust repository README: https://raw.githubusercontent.com/chenxin-yan/crust/main/README.md — architecture/modules, Bun-first framing, starter command, known-user example. [credibility: 8/10, upstream repository]
- npm downloads API: https://api.npmjs.org/downloads/point/last-week/@effect/cli and https://api.npmjs.org/downloads/point/last-week/@crustjs/core — adoption proxy data point. [credibility: 8/10, official npm API]
- GitHub repository signals: https://api.github.com/repos/Effect-TS/effect and https://api.github.com/repos/chenxin-yan/crust — star counts and project activity signal. [credibility: 8/10, official GitHub API]
