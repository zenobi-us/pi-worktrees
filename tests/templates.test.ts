import { describe, expect, it } from 'vitest';
import { expandTemplate } from '../src/services/templates.ts';

describe('expandTemplate', () => {
  it('expands all supported tokens including mainWorktree', () => {
    const output = expandTemplate(
      '{{project}}|{{name}}|{{branch}}|{{path}}|{{mainWorktree}}',
      {
        project: 'repo',
        name: 'feature-a',
        branch: 'feature/feature-a',
        path: '/tmp/repo.worktrees/feature-a',
        mainWorktree: '/tmp/repo',
      }
    );

    expect(output).toBe('repo|feature-a|feature/feature-a|/tmp/repo.worktrees/feature-a|/tmp/repo');
  });
});
