import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { basename } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmdRemove } from '../../src/cmds/cmdRemove.ts';
import type { CommandDeps } from '../../src/types.ts';
import * as gitService from '../../src/services/git.ts';

function createDeps(onBeforeRemove?: string): CommandDeps {
  return {
    settings: {},
    configService: {
      worktrees: new Map(),
      config: {},
      current: vi.fn(() => ({
        project: 'repo',
        mainWorktree: '/main/repo',
        onBeforeRemove,
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

describe('cmdRemove interactive selection integration', () => {
  const notify = vi.fn();
  const confirm = vi.fn();
  const select = vi.fn();
  let removablePathA = '/main/repo.worktrees/feature-a';
  let removablePathB = '/main/repo.worktrees/feature-b';

  beforeEach(() => {
    notify.mockReset();
    confirm.mockReset();
    select.mockReset();

    removablePathA = mkdtempSync(`${tmpdir()}/pi-worktree-remove-a-`);
    removablePathB = mkdtempSync(`${tmpdir()}/pi-worktree-remove-b-`);

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
        path: removablePathA,
        branch: 'feature/feature-a',
        head: 'def',
        isMain: false,
        isCurrent: false,
      },
      {
        path: removablePathB,
        branch: 'feature/feature-b',
        head: 'ghi',
        isMain: false,
        isCurrent: false,
      },
    ]);

    vi.spyOn(gitService, 'git').mockReturnValue('');
  });

  it('prompts with selectable worktrees when no name is provided', async () => {
    select.mockResolvedValue(
      `${basename(removablePathB)} (feature/feature-b)\n  ${removablePathB}`
    );
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
      `${basename(removablePathA)} (feature/feature-a)\n  ${removablePathA}`,
      `${basename(removablePathB)} (feature/feature-b)\n  ${removablePathB}`,
    ]);

    expect(confirm).toHaveBeenCalled();
    expect(gitService.git).toHaveBeenCalledWith(
      ['worktree', 'remove', removablePathB],
      '/main/repo'
    );
    expect(notify).toHaveBeenCalledWith(`✓ Worktree removed: ${removablePathB}`, 'info');
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

  it('blocks removal when onBeforeRemove exits non-zero', async () => {
    select.mockResolvedValue(
      `${basename(removablePathA)} (feature/feature-a)\n  ${removablePathA}`
    );
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

    await cmdRemove('', ctx as never, createDeps('false'));

    expect(gitService.git).not.toHaveBeenCalledWith(
      ['worktree', 'remove', removablePathA],
      '/main/repo'
    );
    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('onBeforeRemove failed');
  });
});
