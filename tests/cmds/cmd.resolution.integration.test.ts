import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmdCreate } from '../../src/cmds/cmdCreate.ts';
import type { CommandDeps } from '../../src/types.ts';
import * as gitService from '../../src/services/git.ts';
import type { WorktreeSettingsConfig } from '../../src/services/config/schema.ts';

type ConfigCurrent = WorktreeSettingsConfig & {
  repo: string;
  project: string;
  mainWorktree: string;
  parentDir: string;
};

function createCurrentResolver(repo: string, repos: Map<string, WorktreeSettingsConfig>) {
  return () => {
    const result = gitService.matchRepo(repo, repos, 'fail-on-tie');
    if (result.type === 'tie-conflict') {
      throw new Error(result.message);
    }
    const settings = result.settings;

    return {
      ...settings,
      repo,
      project: 'repo',
      mainWorktree: '/main/repo',
      parentDir: settings.parentDir ?? '/main/repo.worktrees',
    } as ConfigCurrent;
  };
}

function createDeps(currentResolver: () => ConfigCurrent): CommandDeps {
  return {
    settings: currentResolver(),
    configService: {
      current: vi.fn(() => currentResolver()),
    } as unknown as CommandDeps['configService'],
  };
}

describe('cmdCreate resolution integration', () => {
  const notify = vi.fn();

  beforeEach(() => {
    notify.mockReset();
    vi.spyOn(gitService, 'isGitRepo').mockReturnValue(true);
    vi.spyOn(gitService, 'listWorktrees').mockReturnValue([]);
    vi.spyOn(gitService, 'ensureExcluded').mockImplementation(() => {});

    vi.spyOn(gitService, 'git').mockImplementation((args: string[]) => {
      if (args[0] === 'rev-parse') {
        throw new Error('branch does not exist');
      }
      return '';
    });
  });

  it('uses exact match over wildcard settings when creating a worktree', async () => {
    const repos = new Map<string, WorktreeSettingsConfig>([
      ['github.com/org/*', { parentDir: '/tmp/wildcard.worktrees', onCreate: 'echo wildcard' }],
      ['github.com/org/repo', { parentDir: '/tmp/exact.worktrees', onCreate: 'echo exact' }],
    ]);

    const deps = createDeps(createCurrentResolver('https://github.com/org/repo', repos));
    const ctx = { cwd: '/main/repo', ui: { notify } };

    await cmdCreate('feature-a', ctx as never, deps);

    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/feature-a', '/tmp/exact.worktrees/feature-a'],
      '/main/repo'
    );

    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('[ ] echo exact');
  });

  it('uses fallback pattern settings when no specific repo pattern matches', async () => {
    const repos = new Map<string, WorktreeSettingsConfig>([
      ['github.com/other/*', { parentDir: '/tmp/other.worktrees', onCreate: 'echo other' }],
      ['**', { parentDir: '/tmp/fallback.worktrees', onCreate: 'echo fallback' }],
    ]);

    const deps = createDeps(createCurrentResolver('https://github.com/org/repo', repos));
    const ctx = { cwd: '/main/repo', ui: { notify } };

    await cmdCreate('feature-b', ctx as never, deps);

    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/feature-b', '/tmp/fallback.worktrees/feature-b'],
      '/main/repo'
    );

    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('[ ] echo fallback');
  });
});
