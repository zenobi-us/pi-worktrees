# `@zenobius/pi-worktrees`

<img width="1531" height="1172" alt="image" src="https://github.com/user-attachments/assets/33fe4c01-4d9b-41ec-a326-116db6e750df" />


Git worktree management for [Pi Coding Agent](https://github.com/badlogic/pi-mono) with a clean `/worktree` command surface.

This extension helps you spin up isolated feature workspaces quickly, with safety checks and optional post-create automation.

---

## Why this extension?

When you’re doing multiple feature branches, hotfixes, or experiments, `git worktree` is fantastic—but easy to misuse.

`pi-worktrees` gives you a guided interface inside Pi:

- Create branch-first worktrees (`/worktree create <branch>`) with predictable naming
- Optionally generate branch names via explicit opt-in (`/worktree create --generate ...`)
- List and inspect active worktrees
- Remove worktrees safely (with confirmations)
- Prune stale worktree references
- Configure default worktree location and post-create hook

---

## Install

### Global install (all projects)

```bash
pi install npm:@zenobius/pi-worktrees
```

### Project-local install (shared via `.pi/settings.json`)

```bash
pi install -l npm:@zenobius/pi-worktrees
```

### Local development install

> nothing to do here, it's already defined in `.pi/settings.json#extensions`

---

If Pi is already running, use `/reload` to load newly installed extensions.

---

## Getting started in 2 minutes

1. Install the extension:

```bash
pi install npm:@zenobius/pi-worktrees
```

2. Open a git repo in Pi and run:

```text
/worktree init
/worktree create feature/auth-refactor
/worktree create hotfix/login-timeout --name login-timeout
/worktree list
```

3. Optional: jump into it from your shell using the printed path:

```text
/worktree cd feature-auth-refactor
```

## Quick start

In Pi:

```text
/worktree init
/worktree create feature/auth-refactor
/worktree create spike/new-parser --name parser-spike
/worktree list
/worktree status
/worktree cd feature-auth-refactor
/worktree remove feature-auth-refactor
/worktree prune
```

### Example: How I use `/worktree`

I use Neovim and Zellij, and I want each new worktree to boot a ready-to-code workspace. My `onCreate` looks like:
```json
{
  "worktrees": {
    "**": {
      "worktreeRoot": "{{mainWorktree}}.worktrees",
      "onCreate": [
        "mise trust --yes",
        "mise setup",
        "zellij action new-tab --name {{name}} --cwd {{path}}",
        "zellij action new-pane --in-place --cwd {{path}} -- nvim",
        "zellij action new-pane --cwd {{path}} --direction right -- pi"
      ]
    }
  }
}
```

This creates a new Zellij tab with Neovim and Pi running in the new worktree path.
---

## Command reference

| Command | Description |
|---|---|
| `/worktree init` | Interactive setup for extension settings |
| `/worktree settings` | Show all current settings |
| `/worktree settings <key>` | Get one setting (`worktreeRoot`, `parentDir` alias, `onCreate`) |
| `/worktree settings <key> <value>` | Set one setting |
| `/worktree create <branch> [--name <worktree-name>]`<br/>`/worktree create --generate [--name <worktree-name>] <prompt-or-name>` | Create a new worktree from `<branch>` (default mode) or generate one via configured `branchNameGenerator` (opt-in with `--generate`) |
| `/worktree list` | List all worktrees (`/worktree ls` alias) |
| `/worktree status` | Show current repo/worktree status |
| `/worktree cd <name>` | Print matching worktree path |
| `/worktree remove <name>` | Remove a worktree (`/worktree rm` alias) |
| `/worktree prune` | Remove stale worktree metadata |
| `/worktree templates` | Preview template variables with current + generated values |

---

## Configuration

Settings live in `~/.pi/agent/pi-worktrees.config.json`.

```json
{
  "worktrees": {
    "github.com/org/repo": {
      "worktreeRoot": "~/work/org/repo.worktrees",
      "onCreate": ["mise install", "bun install"],
    },
    "github.com/org/*": {
      "worktreeRoot": "~/work/org/shared.worktrees",
      "onCreate": "mise setup",
      "branchNameGenerator": "pi -p \"branch name for $PI_WORKTREE_PROMPT\" --model local/model"
    }
  },
  "matchingStrategy": "fail-on-tie",
  "onCreateDisplayOutputMaxLines": 5,
  "onCreateCmdDisplayPending": "[ ] {{cmd}}",
  "onCreateCmdDisplaySuccess": "[x] {{cmd}}",
  "onCreateCmdDisplayError": "[ ] {{cmd}} [ERROR]",
  "onCreateCmdDisplayPendingColor": "dim",
  "onCreateCmdDisplaySuccessColor": "success",
  "onCreateCmdDisplayErrorColor": "error",
  "worktree": {
    "worktreeRoot": "~/.local/share/worktrees/{{project}}",
    "onCreate": "mise setup"
  }
}
```

### Configuration reference

| Key | Type | Default | Description |
|---|---|---|---|
| `worktrees` | `Record<string, WorktreeSettings>` | `{}` | Pattern-matched settings by repo URL or glob. |
| `matchingStrategy` | `'fail-on-tie' \| 'first-wins' \| 'last-wins'` | `fail-on-tie` | Tie-break behavior for equally specific patterns. |
| `onCreateDisplayOutputMaxLines` | `number` (integer, `>= 0`) | `5` | Number of latest stdout/stderr lines shown in live UI updates during `onCreate`. |
| `onCreateCmdDisplayPending` | `string` | `[ ] {{cmd}}` | Template for pending/running command display lines. |
| `onCreateCmdDisplaySuccess` | `string` | `[x] {{cmd}}` | Template for successful command display lines. |
| `onCreateCmdDisplayError` | `string` | `[ ] {{cmd}} [ERROR]` | Template for failed command display lines. |
| `onCreateCmdDisplayPendingColor` | `string` | `dim` | Pi theme color name for pending/running command lines. |
| `onCreateCmdDisplaySuccessColor` | `string` | `success` | Pi theme color name for successful command lines. |
| `onCreateCmdDisplayErrorColor` | `string` | `error` | Pi theme color name for failed command lines. |
| `worktrees[*].branchNameGenerator` | `string` | unset | Optional command used only by `/worktree create --generate ...`. Must print exactly one branch name to stdout. Receives `$PI_WORKTREE_PROMPT` env var and supports `{{prompt}}` / `{prompt}` token replacement. |
| `worktree` (legacy) | `WorktreeSettings` | n/a | Legacy fallback shape; migrated automatically. |

### Matching model

For the current repository, settings are resolved in this order:
1. Exact URL match in `worktrees`
2. Most-specific glob match in `worktrees`
3. Normalized fallback pattern `"**"`

At runtime, the extension normalizes the matcher input map to always include `worktrees["**"]`.
If not explicitly configured, that fallback is seeded from built-in defaults (`worktreeRoot: "{{mainWorktree}}.worktrees"`, `onCreate: "echo \"Created {{path}}\""`).
`matchingStrategy` controls ties between equally specific patterns:

- `fail-on-tie` (default)
- `first-wins`
- `last-wins`

### `onCreate`

`onCreate` accepts either:

- a single string command
- an array of commands

When an array is used, commands run sequentially and stop on first failure.

### `onCreateDisplayOutputMaxLines`

Controls only live UI output verbosity for `onCreate` command execution.
- **Default**: `5`
- **Scope**: display only
- **Does not affect**: logfile contents (full stdout/stderr is still logged)

### `onCreate` command line display templates

These templates control how each command line is rendered in the live progress list.

- `onCreateCmdDisplayPending` (default: `[ ] {{cmd}}`)
- `onCreateCmdDisplaySuccess` (default: `[x] {{cmd}}`)
- `onCreateCmdDisplayError` (default: `[ ] {{cmd}} [ERROR]`)

Supported token:
- `{{cmd}}` (or `{cmd}`) → expanded command string

### `onCreate` command line display colors

These settings use Pi theme color names:

- `onCreateCmdDisplayPendingColor` (default: `dim`)
- `onCreateCmdDisplaySuccessColor` (default: `success`)
- `onCreateCmdDisplayErrorColor` (default: `error`)

Supported color names in this extension: `dim`, `accent`, `info`, `success`, `warning`, `error`.

### `worktreeRoot`

Where new worktrees are created.

- **Default**: `{{mainWorktree}}.worktrees`
- Supports template variables

> Backward compatibility: `parentDir` is still accepted as a deprecated alias for `worktreeRoot`.
> The extension will migrate existing `parentDir` values to `worktreeRoot` automatically.
### Create command naming contract

`/worktree create` is branch-first:

- Required first argument is the **branch name** to create.
- Default worktree folder name is `slugify(branch)`.
- Optional `--name <worktree-name>` overrides the derived folder name.

### Optional branch generator (safe opt-in)

Generator mode is **never automatic**. You must pass `--generate` explicitly:

```text
/worktree create --generate login-flow
/worktree create --generate --name ui-login login-flow
```

Safety behavior:
- Branch-first remains default source of truth.
- `branchNameGenerator` is ignored unless `--generate` is present.
- Generator command runs with a strict 5s timeout.
- On timeout, non-zero exit, empty stdout, or invalid branch output: command fails and no worktree is created.
- When a generated branch is used, Pi emits a provenance message before creation.
Examples:

```text
/worktree create feature/login
# branch: feature/login, worktree folder: feature-login

/worktree create feature/login --name ui-login
# branch: feature/login, worktree folder: ui-login
```

### Migration from legacy `<feature-name>` usage

Old mental model:

```text
/worktree create login
# previously implied branch feature/login
```

Current behavior:

```text
/worktree create login
# branch: login, worktree folder: login
```

To preserve old semantics explicitly:

```text
/worktree create feature/login --name login
```

Current releases emit a warning when legacy-style single tokens are detected without `--name`.

### Template variables

Available in `worktreeRoot` and `onCreate` values:

- `{{path}}` → created worktree path
- `{{name}}` → feature/worktree name
- `{{branch}}` → created branch name
- `{{project}}` → repository name
- `{{mainWorktree}}` → main worktree path (repository root)

### Migration note

Legacy single-worktree config remains supported and is migrated through the shared
`@zenobius/pi-extension-config` migration chain.
```json
{
  "worktree": {
    "worktreeRoot": "...",
    "onCreate": "..."
  }
}
```

Migration behavior:

1. Legacy flat keys are normalized to `worktree`
2. Legacy `worktree` is migrated to `worktrees["**"]`
3. Migration version metadata is managed by `@zenobius/pi-extension-config`

Deprecation timing follows the migration policy in `@zenobius/pi-extension-config`.
This extension does not apply a separate ad-hoc deprecation mechanism.

---

## ASCII state machine (extension behavior)

```text
[Idle]
  |
  v
[/worktree <cmd>]
  |
  +--> [unknown/empty] --------------------------> [Show help] --> [Idle]
  |
  +--> [init] --> [has UI?]
  |                 |no
  |                 v
  |               [Error] -----------------------> [Idle]
  |                 |
  |                yes
  |                 v
  |          [Prompt for settings]
  |                 |
  |          [Confirm save?] --no---------------> [Cancelled] --> [Idle]
  |                 |
  |                yes
  |                 v
  |             [Save settings] -----------------> [Idle]
  |
  +--> [create <branch> [--name <worktree-name>]] --> [Validate repo/name/branch/path]
  |                           |fail
  |                           v
  |                         [Error] -------------> [Idle]
  |                           |
  |                          pass
  |                           v
  |                    [git worktree add -b <branch> <worktreePath>]
  |                           |fail
  |                           v
  |                         [Error] -------------> [Idle]
  |                           |
  |                          pass
  |                           v
  |                     [Run onCreate hook?]
  |                           |no
  |                           v
  |                        [Success] -----------> [Idle]
  |                           |
  |                          yes
  |                           v
  |               [Hook succeeds or fails (non-blocking)]
  |                           v
  |                        [Success] -----------> [Idle]
  |
  +--> [remove <name>] --> [Find target + safety checks]
  |                           |fail
  |                           v
  |                         [Error] -------------> [Idle]
  |                           |
  |                          pass
  |                           v
  |                     [Confirm remove?] --no--> [Cancelled] --> [Idle]
  |                           |
  |                          yes
  |                           v
  |                 [git worktree remove]
  |                    |fail (dirty worktree)
  |                    v
  |               [Confirm force?] --no---------> [Cancelled] --> [Idle]
  |                    |
  |                   yes
  |                    v
  |          [git worktree remove --force]
  |                    |fail
  |                    v
  |                  [Error] --------------------> [Idle]
  |                    |
  |                   pass
  |                    v
  |                 [Success] -------------------> [Idle]
  |
  +--> [list | status | cd] ---------------------> [Display info] --> [Idle]
  |
  +--> [prune] --> [dry-run stale refs]
                      |none
                      v
                   [Nothing to do] --------------> [Idle]
                      |
                     found
                      v
                 [Confirm prune?] --no----------> [Cancelled] --> [Idle]
                      |
                     yes
                      v
                 [git worktree prune]
                      |fail
                      v
                    [Error] ---------------------> [Idle]
                      |
                     pass
                      v
                   [Success] --------------------> [Idle]
```

---

## Safety behavior

- Refuses to run mutating commands outside a git repository
- Refuses to create if target branch or worktree path already exists
- Refuses to remove:
  - the main worktree
  - the current worktree
- Uses confirmation prompts for destructive actions
- `onCreate` failures are reported but do **not** undo worktree creation

---

## Troubleshooting

### `Not in a git repository`
Run commands from inside a git repo (or one of its worktrees).

### `Branch '<branch>' already exists`
Choose another branch name or delete/rename the existing branch.

### Can’t remove worktree due to changes
Use `/worktree remove <name>`, then confirm the force remove prompt.

### `cd` does not switch shell directory
`/worktree cd` prints the path; it does not directly mutate your shell state.

---

## Development

```bash
mise run build
mise run test
mise run lint
mise run format
```

---

## License

MIT. See [LICENSE](./LICENSE).
