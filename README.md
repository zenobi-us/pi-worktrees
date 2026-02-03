# pi-worktrees

Worktrees extension for Pi Coding Agent

> A Bun module created from the [bun-module](https://github.com/zenobi-us/bun-module) template

## Features

- Git worktree management commands for Pi
- Interactive setup for worktree settings
- Automatic worktree listing, creation, removal, and pruning

## Usage

Run in Pi:

```
/worktree init
/worktree create <feature-name>
/worktree list
/worktree status
/worktree cd <name>
/worktree remove <name>
/worktree prune
```

## Development

- `mise run build` - Build the module
- `mise run test` - Run tests
- `mise run lint` - Lint code
- `mise run lint:fix` - Fix linting issues
- `mise run format` - Format code with Prettier

## Author

Zenobius <airtonix@users.noreploy.github.com>

## Repository

git@github.com:zenobi-us/pi-worktrees.git

## License

MIT License. See the [LICENSE](LICENSE) file for details.
