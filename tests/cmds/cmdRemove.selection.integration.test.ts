import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmdRemove } from '../../src/cmds/cmdRemove.ts';
import type { CommandDeps } from '../../src/types.ts';
import * as gitService from '../../src/services/git.ts';

function createDeps(): CommandDeps {
  return {
    settings: {},
    configService: {
      worktrees: new Map(),
      config: {},
    } as unknown as CommandDeps['configService'],
  };
}

describe('cmdRemove interactive selection integration', () => {
  const notify = vi.fn();
  const confirm = vi.fn();
  const select = vi.fn();

  beforeEach(() => {
    notify.mockReset();
    confirm.mockReset();
    select.mockReset();

    vi.spyOn(gitService, 'isGitRepo').mockReturnValue(true);
    vi.spyOn(gitService, 'getWorktreeParentDir').mockReturnValue('/main/repo.worktrees');
    vi.spyOn(gitService, 'listWorktrees').mockReturnValue([
      {
        path: '/main/repo',
        branch: 'main',
        head: 'abc',
        isMain: true,
        isCurrent: false,
      },
      {
        path: '/main/repo.worktrees/feature-a',
        branch: 'feature/feature-a',
        head: 'def',
        isMain: false,
        isCurrent: false,
      },
      {
        path: '/main/repo.worktrees/feature-b',
        branch: 'feature/feature-b',
        head: 'ghi',
        isMain: false,
        isCurrent: false,
      },
    ]);

    vi.spyOn(gitService, 'git').mockReturnValue('');
  });

  it('prompts with selectable worktrees when no name is provided', async () => {
    select.mockResolvedValue('feature-b (feature/feature-b)\n  /main/repo.worktrees/feature-b');
    confirm.mockResolvedValue(true);

    const ctx = {
      cwd: '/main/repo',
      hasUI: true,
      ui: {
        notify,
        confirm,
        select,
      },
    };

    await cmdRemove('', ctx as never, createDeps());

    expect(select).toHaveBeenCalledWith('Select worktree to remove', [
      'feature-a (feature/feature-a)\n  /main/repo.worktrees/feature-a',
      'feature-b (feature/feature-b)\n  /main/repo.worktrees/feature-b',
    ]);

    expect(confirm).toHaveBeenCalled();
    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'remove', '/main/repo.worktrees/feature-b'],
      '/main/repo'
    );
    expect(notify).toHaveBeenCalledWith(
      '✓ Worktree removed: /main/repo.worktrees/feature-b',
      'info'
    );
  });

  it('shows usage when no name is provided in non-interactive mode', async () => {
    const ctx = {
      cwd: '/main/repo',
      hasUI: false,
      ui: {
        notify,
        confirm,
        select,
      },
    };

    await cmdRemove('', ctx as never, createDeps());

    expect(notify).toHaveBeenCalledWith('Usage: /worktree remove <name>', 'error');
    expect(select).not.toHaveBeenCalled();
  });
});
