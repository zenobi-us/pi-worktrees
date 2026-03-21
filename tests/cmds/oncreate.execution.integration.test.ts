import { EventEmitter } from 'events';
import { mkdtempSync, readFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { WorktreeSettingsConfig } from '../../src/services/config/schema.ts';

const spawnMock = vi.fn();

vi.mock('child_process', () => ({
  spawn: (...args: unknown[]) => spawnMock(...args),
}));

const { runOnCreateHook } = await import('../../src/cmds/shared.ts');

type SpawnResult = {
  code: number;
  stdout?: string;
  stderr?: string;
};

function createSpawnResultQueue(results: SpawnResult[]) {
  const queue = [...results];

  spawnMock.mockImplementation(() => {
    const next = queue.shift() ?? { code: 0, stdout: '', stderr: '' };
    const child = new EventEmitter() as EventEmitter & {
      stdout: EventEmitter;
      stderr: EventEmitter;
    };

    child.stdout = new EventEmitter();
    child.stderr = new EventEmitter();

    Promise.resolve().then(() => {
      if (next.stdout) {
        child.stdout.emit('data', Buffer.from(next.stdout));
      }
      if (next.stderr) {
        child.stderr.emit('data', Buffer.from(next.stderr));
      }
      child.emit('close', next.code);
    });

    return child;
  });
}

describe('runOnCreateHook execution integration', () => {
  const notify = vi.fn();

  const createdCtx = {
    path: '/tmp/repo.worktrees/feature-x',
    name: 'feature-x',
    branch: 'feature/feature-x',
    project: 'repo',
    mainWorktree: '/tmp/repo',
  };

  beforeEach(() => {
    notify.mockReset();
    spawnMock.mockReset();
  });

  it('runs onCreate commands in order', async () => {
    createSpawnResultQueue([
      { code: 0, stdout: 'first-ok' },
      { code: 0, stdout: 'second-ok' },
    ]);

    const settings: WorktreeSettingsConfig = {
      onCreate: ['echo {{name}}', 'echo {{branch}}'],
    };

    const result = await runOnCreateHook(createdCtx, settings, notify);

    expect(result.success).toBe(true);
    expect(result.executed).toEqual(['echo feature-x', 'echo feature/feature-x']);
    expect(spawnMock).toHaveBeenCalledTimes(2);

    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('onCreate steps:');
    expect(notifiedText).toContain('[ ] echo feature-x');
    expect(notifiedText).toContain('[x] echo feature-x');
    expect(notifiedText).toContain('[ ] echo feature/feature-x');
    expect(notifiedText).toContain('[x] echo feature/feature-x');
  });

  it('stops execution at first command failure', async () => {
    createSpawnResultQueue([
      { code: 0, stdout: 'first-ok' },
      { code: 12, stderr: 'second failed hard' },
      { code: 0, stdout: 'third-should-not-run' },
    ]);

    const settings: WorktreeSettingsConfig = {
      onCreate: ['echo first', 'echo second', 'echo third'],
    };

    const result = await runOnCreateHook(createdCtx, settings, notify);

    expect(result.success).toBe(false);
    expect(result.executed).toEqual(['echo first', 'echo second']);
    expect(result.failed).toEqual({
      command: 'echo second',
      code: 12,
      error: 'second failed hard',
    });
    expect(spawnMock).toHaveBeenCalledTimes(2);

    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('[ ] echo second [ERROR]');
    expect(notifiedText).toContain('onCreate failed (exit 12): second failed hard');
    expect(notifiedText).not.toContain('[x] echo third');
    expect(notifiedText).not.toContain('[ ] echo third [ERROR]');
  });

  it('shows only the latest configured stdout/stderr lines without truncating logfile output', async () => {
    createSpawnResultQueue([
      {
        code: 0,
        stdout: 'line-1\nline-2\nline-3\nline-4\n',
        stderr: 'err-1\nerr-2\nerr-3\n',
      },
    ]);

    const settings: WorktreeSettingsConfig = {
      onCreate: ['echo with-many-lines'],
    };

    const logDir = mkdtempSync(join(tmpdir(), 'pi-worktree-test-'));
    const logPath = join(logDir, 'oncreate.log');

    const result = await runOnCreateHook(createdCtx, settings, notify, {
      logPath,
      displayOutputMaxLines: 2,
    });

    expect(result.success).toBe(true);

    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('› line-4');
    expect(notifiedText).toContain('› line-3');
    expect(notifiedText).toContain('⚠ err-3');
    expect(notifiedText).toContain('⚠ err-2');
    expect(notifiedText).not.toContain('› line-1');
    expect(notifiedText).not.toContain('⚠ err-1');

    const logContent = readFileSync(logPath, 'utf8');
    expect(logContent).toContain('line-1');
    expect(logContent).toContain('line-2');
    expect(logContent).toContain('line-3');
    expect(logContent).toContain('line-4');
    expect(logContent).toContain('err-1');
    expect(logContent).toContain('err-2');
    expect(logContent).toContain('err-3');
  });

  it('applies custom command display templates and color names', async () => {
    createSpawnResultQueue([{ code: 0, stdout: 'ok' }]);

    const settings: WorktreeSettingsConfig = {
      onCreate: ['echo custom-template'],
    };

    const result = await runOnCreateHook(createdCtx, settings, notify, {
      cmdDisplayPending: '⏳ {{cmd}}',
      cmdDisplaySuccess: '✅ {{cmd}}',
      cmdDisplayError: '❌ {{cmd}}',
      cmdDisplayPendingColor: 'accent',
      cmdDisplaySuccessColor: 'success',
      cmdDisplayErrorColor: 'error',
    });

    expect(result.success).toBe(true);

    const notifiedText = notify.mock.calls.map(([msg]) => String(msg)).join('\n');
    expect(notifiedText).toContain('⏳ echo custom-template');
    expect(notifiedText).toContain('✅ echo custom-template');
  });
});
