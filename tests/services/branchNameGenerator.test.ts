import { describe, expect, it } from 'vitest';

import { generateBranchName } from '../../src/services/branchNameGenerator.ts';

describe('branchNameGenerator', () => {
  it('returns generated branch on success', async () => {
    const result = await generateBranchName({
      commandTemplate: 'node -e "process.stdout.write(\'feature/generated\\n\')"',
      input: 'ignored',
      cwd: process.cwd(),
      timeoutMs: 200,
    });

    expect(result).toEqual({
      ok: true,
      branchName: 'feature/generated',
      command: 'node -e "process.stdout.write(\'feature/generated\\n\')"',
    });
  });

  it('fails on timeout', async () => {
    const result = await generateBranchName({
      commandTemplate: 'node -e "setTimeout(() => process.stdout.write(\'feature/late\'), 500)"',
      input: 'ignored',
      cwd: process.cwd(),
      timeoutMs: 25,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('timeout');
  });

  it('fails on non-zero exit', async () => {
    const result = await generateBranchName({
      commandTemplate: 'node -e "process.stderr.write(\'boom\'); process.exit(2)"',
      input: 'ignored',
      cwd: process.cwd(),
      timeoutMs: 200,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('non-zero-exit');
  });

  it('fails on empty output', async () => {
    const result = await generateBranchName({
      commandTemplate: 'node -e "process.stdout.write(\'   \')"',
      input: 'ignored',
      cwd: process.cwd(),
      timeoutMs: 200,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('empty-output');
  });

  it('fails on invalid branch output', async () => {
    const result = await generateBranchName({
      commandTemplate: 'node -e "process.stdout.write(\'not a branch\')"',
      input: 'ignored',
      cwd: process.cwd(),
      timeoutMs: 200,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      return;
    }

    expect(result.code).toBe('invalid-output');
  });
});
