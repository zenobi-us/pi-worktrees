import { EventEmitter } from 'events';
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

    queueMicrotask(() => {
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
    createSpawnResultQueue([{ code: 0, stdout: 'first-ok' }, { code: 0, stdout: 'second-ok' }]);

    const settings: WorktreeSettingsConfig = {
      onCreate: ['echo {{name}}', 'echo {{branch}}'],
    };

    const result = await runOnCreateHook(createdCtx, settings, notify);

    expect(result.success).toBe(true);
    expect(result.executed).toEqual(['echo feature-x', 'echo feature/feature-x']);
    expect(spawnMock).toHaveBeenCalledTimes(2);
    expect(notify).toHaveBeenCalledWith('Running: echo feature-x', 'info');
    expect(notify).toHaveBeenCalledWith('Running: echo feature/feature-x', 'info');
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
  });
});
