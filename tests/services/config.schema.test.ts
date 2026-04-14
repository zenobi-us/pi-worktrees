import { describe, expect, it } from 'vitest';
import { Parse } from 'typebox/value';

import { PiWorktreeConfigSchema } from '../../src/services/config/schema.ts';

describe('PiWorktreeConfigSchema matchingStrategy', () => {
  it('accepts all supported strategy enum values', () => {
    expect(Parse(PiWorktreeConfigSchema, { matchingStrategy: 'fail-on-tie' })).toEqual({
      matchingStrategy: 'fail-on-tie',
    });
    expect(Parse(PiWorktreeConfigSchema, { matchingStrategy: 'first-wins' })).toEqual({
      matchingStrategy: 'first-wins',
    });
    expect(Parse(PiWorktreeConfigSchema, { matchingStrategy: 'last-wins' })).toEqual({
      matchingStrategy: 'last-wins',
    });
  });

  it('rejects invalid matchingStrategy enum values', () => {
    expect(() =>
      Parse(PiWorktreeConfigSchema, {
        matchingStrategy: 'random-wins',
      })
    ).toThrow();
  });
});

describe('PiWorktreeConfigSchema branchNameGenerator', () => {
  it('accepts optional branchNameGenerator command string in worktree settings', () => {
    expect(
      Parse(PiWorktreeConfigSchema, {
        worktrees: {
          'github.com/org/repo': {
            worktreeRoot: '/tmp/repo.worktrees',
            branchNameGenerator: 'echo feature/generated',
          },
        },
      })
    ).toEqual({
      worktrees: {
        'github.com/org/repo': {
          worktreeRoot: '/tmp/repo.worktrees',
          branchNameGenerator: 'echo feature/generated',
        },
      },
    });
  });
});
