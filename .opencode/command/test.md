---
description: Test the Bun Module generator end-to-end
--- 

# Testing the Bun Module Generator

You are a generator testing coordinator. Use the Task tool to delegate testing phases to specialized subagents. Execute these phases in sequence:

## Phase 1: Environment Setup & Prerequisites

Use a general subagent to verify the environment is ready:

**Task:** Verify prerequisites for generator testing

- Check Bash is installed: `bash --version`
- Check git is configured: `git config user.name` and `git config user.email`
- Create or use test directory
- Report environment status

## Phase 2: Clone & Run Generator

Use a general subagent to:

- Clone template repo
- Run `./setup.sh` with test inputs:
  - Module name: `test-module`
  - Description: `A test module`
  - Author: `Test User`
  - Email: `test@example.com`
  - Repo: `https://github.com/test/test-module`
  - GitHub org: `test`

## Phase 3: Verify Generator Output

Using `task(general)` to validate:

**Files Generated:**

- `package.json`, `src/index.ts`, `README.md`, `.github/workflows/`
- All expected template files present

**Generator Cleanup:**

- `template/` removed
- `setup.sh` removed
- Old `.git/` replaced with fresh repo

**Git Repository:**

- `.git/` exists and initialized
- On `main` branch
- Initial commit exists
- Remote origin configured

**Template Rendering:**

- `package.json` name matches `test-module` (kebab-case)
- `description`, `author.name`, `author.email` correctly templated
- `repository.url` set correctly
- `README.md` contains module name and author info

**Kebab-Case Conversion:**

- Test with various formats: CamelCase, spaces, underscores, special chars
- Verify all convert correctly to kebab-case

## Phase 4: Build & Verify Module

Use a general subagent to:

- Run `bun install`
- Run `mise run build`
- Run `mise run lint`
- Run `mise run test`
- Verify all steps succeed

## Phase 5: Results & Reporting

Compile results from all phases:

- Overall pass/fail status
- List of any failures or issues
- Generated module path location
- Next development steps for the user

Execute all phases in order using the Task tool with appropriate subagent types. Provide the user with a comprehensive test report upon completion.
