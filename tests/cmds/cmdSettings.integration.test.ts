import { describe, expect, it, vi } from 'vitest';

import { cmdSettings } from '../../src/cmds/cmdSettings.ts';
import type { CommandDeps } from '../../src/types.ts';

function createDeps(overrides?: {
  matchedPattern?: string;
  worktrees?: Record<string, Record<string, unknown>>;
}) {
  const matchedPattern = overrides?.matchedPattern ?? 'github.com/org/repo';
  const worktrees = overrides?.worktrees ?? {
    [matchedPattern]: {
      onCreate: 'echo "Created {{path}}"',
    },
  };

  const current = {
    matchedPattern,
    worktreeRoot: '/tmp/repo.worktrees',
    onCreate: 'echo "Created {{path}}"',
  };

  const configService = {
    current: vi.fn(() => current),
    config: { worktrees },
    save: vi.fn(async () => {}),
  } as unknown as CommandDeps['configService'];

  return {
    settings: current as CommandDeps['settings'],
    configService,
    statusService: {} as CommandDeps['statusService'],
  } satisfies CommandDeps;
}

describe('cmdSettings persistence integration', () => {
  it('persists updated worktreeRoot for the matched pattern', async () => {
    const deps = createDeps();
    const notify = vi.fn();
    const ctx = { cwd: '/repo', ui: { notify } };

    await cmdSettings('worktreeRoot /custom/path', ctx as never, deps);

    expect(deps.configService.save).toHaveBeenCalledWith({
      worktrees: {
        'github.com/org/repo': {
          onCreate: 'echo "Created {{path}}"',
          worktreeRoot: '/custom/path',
        },
      },
    });
  });

  it('clears worktreeRoot/parentDir for the matched pattern and keeps other settings', async () => {
    const deps = createDeps({
      worktrees: {
        'github.com/org/repo': {
          onCreate: 'echo "Created {{path}}"',
          worktreeRoot: '/tmp/repo.worktrees',
          parentDir: '/tmp/legacy.worktrees',
        },
      },
    });
    const notify = vi.fn();
    const ctx = { cwd: '/repo', ui: { notify } };

    await cmdSettings('worktreeRoot clear', ctx as never, deps);

    expect(deps.configService.save).toHaveBeenCalledWith({
      worktrees: {
        'github.com/org/repo': {
          onCreate: 'echo "Created {{path}}"',
        },
      },
    });
  });
});
