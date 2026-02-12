# `@zenobius/pi-worktrees`

Git worktree management for [Pi Coding Agent](https://github.com/badlogic/pi-mono) with a clean `/worktree` command surface.

This extension helps you spin up isolated feature workspaces quickly, with safety checks and optional post-create automation.

---

## Why this extension?

When you’re doing multiple feature branches, hotfixes, or experiments, `git worktree` is fantastic—but easy to misuse.

`pi-worktrees` gives you a guided interface inside Pi:

- Create feature worktrees with consistent branch naming (`feature/<name>`)
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

## Quick start

In Pi:

```text
/worktree init
/worktree create auth-refactor
/worktree list
/worktree status
/worktree cd auth-refactor
/worktree remove auth-refactor
/worktree prune
```

---

## Command reference

| Command | Description |
|---|---|
| `/worktree init` | Interactive setup for extension settings |
| `/worktree settings` | Show all current settings |
| `/worktree settings <key>` | Get one setting (`parentDir`, `onCreate`) |
| `/worktree settings <key> <value>` | Set one setting |
| `/worktree create <feature-name>` | Create a new worktree + branch `feature/<feature-name>` |
| `/worktree list` | List all worktrees (`/worktree ls` alias) |
| `/worktree status` | Show current repo/worktree status |
| `/worktree cd <name>` | Print matching worktree path |
| `/worktree remove <name>` | Remove a worktree (`/worktree rm` alias) |
| `/worktree prune` | Remove stale worktree metadata |

---

## Configuration

Settings live in `~/.pi/agent/pi-worktrees-settings.json` under `worktree`: 

```json
{
  "worktree": {
    "parentDir": "~/.local/share/worktrees/{{project}}",
    "onCreate": "mise setup"
  }
}
```

### `parentDir`

Where new worktrees are created.

- **Default**: `../<project>.worktrees/` (relative to your main worktree)
- Supports template variables

### `onCreate`

Optional command run **after** successful worktree creation, in the new worktree directory.

Useful examples:

- `mise setup`
- `bun install`
- `mise setup && bun install`

### Template variables

Available in `parentDir` and `onCreate` strings:

- `{{path}}` → created worktree path
- `{{name}}` → feature/worktree name
- `{{branch}}` → created branch name
- `{{project}}` → repository name

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
  +--> [create <name>] --> [Validate repo/name/branch/path]
  |                           |fail
  |                           v
  |                         [Error] -------------> [Idle]
  |                           |
  |                          pass
  |                           v
  |                    [git worktree add -b feature/<name>]
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

### `Branch 'feature/<name>' already exists`
Choose another feature name or delete/rename the branch.

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
