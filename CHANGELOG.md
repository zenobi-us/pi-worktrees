# Changelog

## [0.5.1](https://github.com/zenobi-us/pi-worktrees/compare/v0.5.0...v0.5.1) (2026-04-24)


### Bug Fixes

* persist /worktree settings updates ([#17](https://github.com/zenobi-us/pi-worktrees/issues/17)) ([4360a4c](https://github.com/zenobi-us/pi-worktrees/commit/4360a4c241db72391212f7bc3037e471705e8d6f)), closes [#14](https://github.com/zenobi-us/pi-worktrees/issues/14)

## [0.5.0](https://github.com/zenobi-us/pi-worktrees/compare/v0.4.0...v0.5.0) (2026-04-01)


### Features

* **memory/epic:** add cli-only decoupling epic e9f4a1c2 ([4ce0639](https://github.com/zenobi-us/pi-worktrees/commit/4ce0639d4e09ee8f40b6baf2f20ba2848ef50ea8))
* **memory:** add epic for exposing subcommands as tools ([bcb9abc](https://github.com/zenobi-us/pi-worktrees/commit/bcb9abcaadf2d9bef5985c8eb064ba64724c22cc))
* **memory:** begin story 91 definition with task breakdown ([b75d1a1](https://github.com/zenobi-us/pi-worktrees/commit/b75d1a1020f89b814cea6cf83d70ecdfa81b81df))
* **memory:** define worktrees tool discovery backlog ([8c6489f](https://github.com/zenobi-us/pi-worktrees/commit/8c6489fe2b28a2c375131ec68965c3089f30cf87))
* **memory:** start cli-only execution planning ([43126bc](https://github.com/zenobi-us/pi-worktrees/commit/43126bcfd25c8f9f2778a81b003c4361fad98361))
* **worktree:** add branch-first create flow with explicit generator mode ([2fdb605](https://github.com/zenobi-us/pi-worktrees/commit/2fdb605edc5346ac5e0f836aa98cf695b310f690))
* **worktree:** improve interactive switching and lifecycle hooks (feat/interactive-ls-oncreate) ([#13](https://github.com/zenobi-us/pi-worktrees/issues/13)) ([b581f6e](https://github.com/zenobi-us/pi-worktrees/commit/b581f6eafa87badc4a4814125b09144df160d6ec))

## [0.4.0](https://github.com/zenobi-us/pi-worktrees/compare/v0.3.0...v0.4.0) (2026-03-21)


### Features

* **config:** normalize fallback settings before repo match (fallback-normalization-from-main) ([#8](https://github.com/zenobi-us/pi-worktrees/issues/8)) ([c8952f8](https://github.com/zenobi-us/pi-worktrees/commit/c8952f8044eae285750ffed373f88972620912f6))

## [0.3.0](https://github.com/zenobi-us/pi-worktrees/compare/v0.2.0...v0.3.0) (2026-03-21)


### Features

* **config:** add onCreate display output max lines (no-ticket) ([#6](https://github.com/zenobi-us/pi-worktrees/issues/6)) ([ec24c8f](https://github.com/zenobi-us/pi-worktrees/commit/ec24c8fb4b23cdde637d69e2151a5ace4892589e))

## [0.2.0](https://github.com/zenobi-us/pi-worktrees/compare/v0.1.0...v0.2.0) (2026-03-20)


### Features

* add config migrations and reorganize config module ([b0e88d8](https://github.com/zenobi-us/pi-worktrees/commit/b0e88d8e42a439c15c380fc404928e747e3612f9))
* add template preview command and mainWorktree token ([36de89a](https://github.com/zenobi-us/pi-worktrees/commit/36de89ac0625c412ae3b02f4e052155be5593df1))
* **cmdRemove:** add interactive worktree selection flow ([b7228c5](https://github.com/zenobi-us/pi-worktrees/commit/b7228c5c1bc5a157b2b3e3e00aaa6f626129ceb7))
* **config:** add multi-worktree matching and fallback resolution ([1a1c8fd](https://github.com/zenobi-us/pi-worktrees/commit/1a1c8fd89ad4cb549c6e980ddb200f489b7bc553))
* **config:** add versioned legacy worktree migration chain ([8a4588a](https://github.com/zenobi-us/pi-worktrees/commit/8a4588a60efd6ed2cc48a69aa5a241c0d7162361))
* **config:** migrate to worktreeRoot and enrich onCreate logging ([33e95d1](https://github.com/zenobi-us/pi-worktrees/commit/33e95d14fc07804295209571ac4c0003e23647de))
* **config:** switch to pi-extension-config ([920e7b7](https://github.com/zenobi-us/pi-worktrees/commit/920e7b74733e57ca882cc06b694f2b933f2cd168))
* **list:** show configured worktree mappings ([7cf815c](https://github.com/zenobi-us/pi-worktrees/commit/7cf815cd6691e1a3181ed3cc2bc354081af97e6a))
* **matcher:** normalize repo refs and cover matcher edge cases ([bfee047](https://github.com/zenobi-us/pi-worktrees/commit/bfee0476adff94147352ae83175dbb55c97e02dd))


### Bug Fixes

* **config:** reload store before reads and pass settings to handlers ([a43011a](https://github.com/zenobi-us/pi-worktrees/commit/a43011ad9e2b434c1d3a9bde49e2486407ac47d1))
* **extension:** surface matcher and command execution errors ([e2860d8](https://github.com/zenobi-us/pi-worktrees/commit/e2860d806ff925aba90782507b366492f14196b3))
* handle missing session manager/logfile in cmdCreate ([#5](https://github.com/zenobi-us/pi-worktrees/issues/5)) ([f39476f](https://github.com/zenobi-us/pi-worktrees/commit/f39476fe411b02928c701b85097da33629b8a8f4))
* remove unused settings path ([3d94a8a](https://github.com/zenobi-us/pi-worktrees/commit/3d94a8a87d26b83c859c3eaa0ba69c35efe8de92))

## [0.1.0](https://github.com/zenobi-us/pi-worktrees/compare/v0.0.2...v0.1.0) (2026-02-13)


### Features

* **worktree:** add nconf-based config service ([7ac3cd2](https://github.com/zenobi-us/pi-worktrees/commit/7ac3cd255848d754ff1f4ab6eb50551fde0b5452))


### Bug Fixes

* **build:** run setup before build task ([c268849](https://github.com/zenobi-us/pi-worktrees/commit/c2688499921c445ad093a80e2d373d3af971f3e7))

## [0.0.2](https://github.com/zenobi-us/pi-worktrees/compare/v0.0.1...v0.0.2) (2026-02-03)


### Bug Fixes

* remove opencode artifacts ([643a1ea](https://github.com/zenobi-us/pi-worktrees/commit/643a1ea30c1c37af5055802d9a055eaabdd6d5c3))

## Changelog

All notable changes to this project will be documented here by Release Please.
