import { describe, expect, it } from 'vitest';
import type { ResolvedConfig } from '../src/services/config.ts';
import { normalizeGitUrl } from '../src/services/git.ts';
import { isTieConflict, matchRepo } from '../src/services/repoMatcher.ts';

describe('normalizeGitUrl', () => {
  it('normalizes ssh and strips .git suffix', () => {
    expect(normalizeGitUrl('git@github.com:Org/Repo.git')).toBe('https://github.com/org/repo');
    expect(normalizeGitUrl('ssh://git@github.com/Org/Repo.git')).toBe(
      'https://github.com/org/repo'
    );
    expect(normalizeGitUrl('https://github.com/Org/Repo.git')).toBe('https://github.com/org/repo');
  });
});

describe('matchRepo', () => {
  const baseConfig: ResolvedConfig = {
    worktrees: {},
    matchingStrategy: 'fail-on-tie',
    fallback: { parentDir: '~/fallback' },
  };

  it('prioritizes exact match over globs', () => {
    const config: ResolvedConfig = {
      ...baseConfig,
      worktrees: {
        'github.com/org/repo': { parentDir: '~/exact' },
        'github.com/org/*': { parentDir: '~/glob' },
      },
    };

    const result = matchRepo('https://github.com/org/repo', config);
    expect(isTieConflict(result)).toBe(false);

    if (!isTieConflict(result)) {
      expect(result.settings.parentDir).toBe('~/exact');
      expect(result.matchedPattern).toBe('github.com/org/repo');
      expect(result.isExact).toBe(true);
    }
  });

  it('uses most specific glob when no exact match exists', () => {
    const config: ResolvedConfig = {
      ...baseConfig,
      worktrees: {
        'github.com/**': { parentDir: '~/github' },
        'github.com/org/*': { parentDir: '~/org' },
      },
    };

    const result = matchRepo('https://github.com/org/repo', config);
    expect(isTieConflict(result)).toBe(false);

    if (!isTieConflict(result)) {
      expect(result.settings.parentDir).toBe('~/org');
      expect(result.matchedPattern).toBe('github.com/org/*');
    }
  });

  it('returns tie conflict for equal specificity under fail-on-tie', () => {
    const config: ResolvedConfig = {
      ...baseConfig,
      worktrees: {
        'github.com/*/repo': { parentDir: '~/a' },
        'github.com/org/*': { parentDir: '~/b' },
      },
    };

    const result = matchRepo('https://github.com/org/repo', config);
    expect(isTieConflict(result)).toBe(true);

    if (isTieConflict(result)) {
      expect(result.patterns).toEqual(['github.com/*/repo', 'github.com/org/*']);
    }
  });

  it('uses first or last winner under tie strategies', () => {
    const firstWins: ResolvedConfig = {
      ...baseConfig,
      matchingStrategy: 'first-wins',
      worktrees: {
        'github.com/*/repo': { parentDir: '~/first' },
        'github.com/org/*': { parentDir: '~/second' },
      },
    };

    const first = matchRepo('https://github.com/org/repo', firstWins);
    expect(isTieConflict(first)).toBe(false);
    if (!isTieConflict(first)) {
      expect(first.settings.parentDir).toBe('~/first');
    }

    const lastWins: ResolvedConfig = {
      ...firstWins,
      matchingStrategy: 'last-wins',
    };

    const last = matchRepo('https://github.com/org/repo', lastWins);
    expect(isTieConflict(last)).toBe(false);
    if (!isTieConflict(last)) {
      expect(last.settings.parentDir).toBe('~/second');
    }
  });

  it('falls back when nothing matches or worktrees empty', () => {
    const unmatched: ResolvedConfig = {
      ...baseConfig,
      worktrees: {
        'gitlab.com/**': { parentDir: '~/gitlab' },
      },
    };

    const noMatch = matchRepo('https://github.com/org/repo', unmatched);
    expect(isTieConflict(noMatch)).toBe(false);
    if (!isTieConflict(noMatch)) {
      expect(noMatch.matchedPattern).toBeNull();
      expect(noMatch.settings.parentDir).toBe('~/fallback');
    }

    const empty = matchRepo('https://github.com/org/repo', baseConfig);
    expect(isTieConflict(empty)).toBe(false);
    if (!isTieConflict(empty)) {
      expect(empty.matchedPattern).toBeNull();
      expect(empty.settings.parentDir).toBe('~/fallback');
    }
  });
});
