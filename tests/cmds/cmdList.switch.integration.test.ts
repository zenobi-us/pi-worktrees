import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmdList } from '../../src/cmds/cmdList.ts';
import type { CommandDeps } from '../../src/types.ts';
import * as gitService from '../../src/services/git.ts';

describe('cmdList onSwitch integration', () => {
  const notify = vi.fn();
  const select = vi.fn();
  let worktreePath = '';

  function createDeps(): CommandDeps {
    return {
      settings: {},
      configService: {
        current: vi.fn(() => ({
          onSwitch: 'echo switched {{name}}',
          project: 'repo',
          mainWorktree: '/main/repo',
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

  beforeEach(() => {
    notify.mockReset();
    select.mockReset();

    worktreePath = mkdtempSync(`${tmpdir()}/pi-worktree-list-`);

    vi.spyOn(gitService, 'isGitRepo').mockReturnValue(true);
    vi.spyOn(gitService, 'listWorktrees').mockReturnValue([
      {
        path: worktreePath,
        branch: 'feature/feature-a',
        head: 'abc123',
        isMain: false,
        isCurrent: false,
      },
    ]);
  });

  it('runs onSwitch for selected worktree', async () => {
    select.mockResolvedValue(`feature/feature-a\n  ${worktreePath}`);

    const ctx = {
      cwd: '/main/repo',
      hasUI: true,
      ui: {
        notify,
        select,
      },
    };

    await cmdList('', ctx as never, createDeps());

    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('onSwitch steps:');
    expect(notifiedText).toContain('echo switched');
  });
});
