import { mkdtempSync, readFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { runOnCreateHook } from '../src/cmds/shared.ts';

const dirs: string[] = [];

function createTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'pi-worktrees-test-'));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe('runOnCreateHook', () => {
  it('runs array commands in order', async () => {
    const dir = createTempDir();
    const notify = vi.fn();

    const result = await runOnCreateHook(
      {
        path: dir,
        name: 'feature-a',
        branch: 'feature/feature-a',
        project: 'proj',
        mainWorktree: '/tmp/main',
      },
      {
        onCreate: ['echo first >> order.txt', 'echo second >> order.txt'],
      },
      notify
    );

    expect(result.success).toBe(true);
    expect(result.executed).toEqual(['echo first >> order.txt', 'echo second >> order.txt']);

    const fileContents = readFileSync(join(dir, 'order.txt'), 'utf-8');
    expect(fileContents.trim().split('\n')).toEqual(['first', 'second']);
    expect(notify).toHaveBeenCalledWith('Running: echo first >> order.txt', 'info');
    expect(notify).toHaveBeenCalledWith('Running: echo second >> order.txt', 'info');
  });

  it('stops on first failure and reports failing command', async () => {
    const dir = createTempDir();
    const notify = vi.fn();

    const result = await runOnCreateHook(
      {
        path: dir,
        name: 'feature-b',
        branch: 'feature/feature-b',
        project: 'proj',
        mainWorktree: '/tmp/main',
      },
      {
        onCreate: ['echo start >> run.txt', 'false', 'echo after >> run.txt'],
      },
      notify
    );

    expect(result.success).toBe(false);
    expect(result.executed).toEqual(['echo start >> run.txt', 'false']);
    expect(result.failed?.command).toBe('false');

    const fileContents = readFileSync(join(dir, 'run.txt'), 'utf-8');
    expect(fileContents.trim().split('\n')).toEqual(['start']);

    expect(notify).toHaveBeenCalledWith(expect.stringContaining('onCreate failed (exit'), 'error');
  });
});
