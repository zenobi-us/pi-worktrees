import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmdCreate } from '../../src/cmds/cmdCreate.ts';
import type { CommandDeps } from '../../src/types.ts';
import * as gitService from '../../src/services/git.ts';
import * as branchGeneratorService from '../../src/services/branchNameGenerator.ts';

function createDeps(): CommandDeps {
  return {
    settings: {} as CommandDeps['settings'],
    configService: {
      current: vi.fn(() => ({
        repo: 'https://github.com/org/repo',
        project: 'repo',
        mainWorktree: '/main/repo',
        parentDir: '/tmp/repo.worktrees',
        logfile: '/tmp/pi-worktree-{sessionId}-{name}.log',
        onCreateDisplayOutputMaxLines: 5,
        onCreateCmdDisplayPending: '[ ] {{cmd}}',
        onCreateCmdDisplaySuccess: '[x] {{cmd}}',
        onCreateCmdDisplayError: '[ ] {{cmd}} [ERROR]',
        onCreateCmdDisplayPendingColor: 'dim',
        onCreateCmdDisplaySuccessColor: 'success',
        onCreateCmdDisplayErrorColor: 'error',
      })),
    } as unknown as CommandDeps['configService'],
    statusService: {
      busy: vi.fn(() => vi.fn()),
      positive: vi.fn(),
      critical: vi.fn(),
    } as unknown as CommandDeps['statusService'],
  };
}

describe('cmdCreate branch-first integration', () => {
  const notify = vi.fn();
  const confirm = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    notify.mockReset();
    confirm.mockReset();

    vi.spyOn(gitService, 'isGitRepo').mockReturnValue(true);
    vi.spyOn(gitService, 'listWorktrees').mockReturnValue([]);
    vi.spyOn(gitService, 'ensureExcluded').mockImplementation(() => {});
    vi.spyOn(gitService, 'git').mockImplementation((args: string[]) => {
      if (args[0] === 'rev-parse') {
        throw new Error('branch does not exist');
      }

      return '';
    });
    vi.spyOn(branchGeneratorService, 'generateBranchName').mockResolvedValue({
      ok: true,
      branchName: 'feature/generated',
      command: 'echo feature/generated',
    });
  });

  it('parses branch-first and derives worktree name from slug', async () => {
    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: true, ui: { notify, confirm } };

    await cmdCreate('feature/login', ctx as never, deps);

    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/login', '/tmp/repo.worktrees/feature-login'],
      '/main/repo'
    );
  });

  it('uses --name override instead of derived slug', async () => {
    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: true, ui: { notify, confirm } };

    await cmdCreate('feature/login --name ui-login', ctx as never, deps);

    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/login', '/tmp/repo.worktrees/ui-login'],
      '/main/repo'
    );
  });

  it('reports collision for derived name path', async () => {
    vi.spyOn(gitService, 'listWorktrees').mockReturnValue([
      {
        path: '/tmp/repo.worktrees/feature-login',
        branch: 'feature/other',
        head: 'abc',
        isMain: false,
        isCurrent: false,
      },
    ]);

    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: false, ui: { notify, confirm } };

    await cmdCreate('feature/login', ctx as never, deps);

    expect(gitService.git).not.toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/login', '/tmp/repo.worktrees/feature-login'],
      '/main/repo'
    );
    expect(notify).toHaveBeenCalledWith(
      'Worktree already exists at: /tmp/repo.worktrees/feature-login',
      'error'
    );
  });

  it('reports collision for explicit name', async () => {
    vi.spyOn(gitService, 'listWorktrees').mockReturnValue([
      {
        path: '/tmp/repo.worktrees/ui-login',
        branch: 'feature/other',
        head: 'abc',
        isMain: false,
        isCurrent: false,
      },
    ]);

    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: false, ui: { notify, confirm } };

    await cmdCreate('feature/login --name ui-login', ctx as never, deps);

    expect(notify).toHaveBeenCalledWith(
      'Worktree already exists at: /tmp/repo.worktrees/ui-login',
      'error'
    );
  });

  it('rejects invalid explicit name values', async () => {
    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: true, ui: { notify, confirm } };

    await cmdCreate('feature/login --name bad/name', ctx as never, deps);

    expect(notify).toHaveBeenCalledWith(
      "Invalid worktree name for --name. Use only letters, numbers, '.', '_' or '-' (no '/').",
      'error'
    );
    expect(gitService.git).not.toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/login', '/tmp/repo.worktrees/bad/name'],
      '/main/repo'
    );
  });

  it('shows legacy warning in warn mode and still creates in non-UI flow', async () => {
    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: false, ui: { notify, confirm } };

    await cmdCreate('login-flow', ctx as never, deps);

    const messages = notify.mock.calls.map(([message]) => String(message)).join('\n');
    expect(messages).toContain('Legacy create style detected');
    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'login-flow', '/tmp/repo.worktrees/login-flow'],
      '/main/repo'
    );
  });

  it('uses generated branch with provenance notice when --generate is provided', async () => {
    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: true, ui: { notify, confirm } };

    vi.spyOn(branchGeneratorService, 'generateBranchName').mockResolvedValue({
      ok: true,
      branchName: 'feature/from-generator',
      command: 'echo feature/from-generator',
    });

    await cmdCreate('--generate login-flow', ctx as never, deps);

    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/from-generator', '/tmp/repo.worktrees/login-flow'],
      '/main/repo'
    );

    const messages = notify.mock.calls.map(([message]) => String(message)).join('\n');
    expect(messages).toContain(
      "Using generated branch 'feature/from-generator' from branchNameGenerator"
    );
  });

  it('never uses generator when branch is explicitly provided without --generate', async () => {
    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: true, ui: { notify, confirm } };

    await cmdCreate('feature/direct-branch', ctx as never, deps);

    expect(branchGeneratorService.generateBranchName).not.toHaveBeenCalled();
    expect(gitService.git).toHaveBeenCalledWith(
      [
        'worktree',
        'add',
        '-b',
        'feature/direct-branch',
        '/tmp/repo.worktrees/feature-direct-branch',
      ],
      '/main/repo'
    );
  });

  it('stops create flow when generator fails', async () => {
    const deps = createDeps();
    const ctx = { cwd: '/main/repo', hasUI: true, ui: { notify, confirm } };

    vi.spyOn(branchGeneratorService, 'generateBranchName').mockResolvedValue({
      ok: false,
      code: 'timeout',
      message: 'branchNameGenerator timed out after 5000ms',
    });

    await cmdCreate('--generate login-flow', ctx as never, deps);

    expect(notify).toHaveBeenCalledWith('branchNameGenerator timed out after 5000ms', 'error');
    expect(gitService.git).not.toHaveBeenCalledWith(
      ['worktree', 'add', '-b', 'feature/from-generator', '/tmp/repo.worktrees/login-flow'],
      '/main/repo'
    );
  });
});
