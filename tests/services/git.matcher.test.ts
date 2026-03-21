import { describe, expect, it } from 'vitest';
import { matchRepo } from '../../src/services/git.ts';
import type { WorktreeSettingsConfig } from '../../src/services/config/schema.ts';

function makeRepos(entries: Array<[string, WorktreeSettingsConfig]>) {
  return new Map(entries);
}

describe('matchRepo normalization and strategy behavior', () => {
  it('normalizes ssh/https forms to the same repo target', () => {
    const repos = makeRepos([['github.com/org/repo', { parentDir: '/tmp/exact' }]]);

    const httpsResult = matchRepo('https://github.com/org/repo.git', repos);
    const sshResult = matchRepo('git@github.com:org/repo.git', repos);

    expect(httpsResult.type).toBe('exact');
    expect(sshResult.type).toBe('exact');

    if (httpsResult.type === 'tie-conflict' || sshResult.type === 'tie-conflict') {
      throw new Error('Expected exact normalized match result');
    }

    expect(httpsResult.matchedPattern).toBe('github.com/org/repo');
    expect(sshResult.matchedPattern).toBe('github.com/org/repo');
  });

  it('maps null remote urls to wildcard fallback pattern', () => {
    const repos = makeRepos([
      ['github.com/org/repo', { parentDir: '/tmp/exact' }],
      ['**', { parentDir: '/tmp/fallback' }],
    ]);

    const result = matchRepo(null, repos);

    expect(result.type).toBe('exact');
    if (result.type === 'tie-conflict') {
      throw new Error('Expected fallback exact match result');
    }

    expect(result.matchedPattern).toBe('**');
    expect(result.settings.parentDir).toBe('/tmp/fallback');
  });

  it('uses segment-based specificity for glob ranking', () => {
    const repos = makeRepos([
      ['github.com/org/*/*', { parentDir: '/tmp/less-specific' }],
      ['github.com/org/team/*', { parentDir: '/tmp/more-specific' }],
    ]);

    const result = matchRepo('https://github.com/org/team/repo', repos);

    expect(result.type).toBe('exact');
    if (result.type === 'tie-conflict') {
      throw new Error('Expected deterministic non-tie result');
    }

    expect(result.matchedPattern).toBe('github.com/org/team/*');
    expect(result.settings.parentDir).toBe('/tmp/more-specific');
  });

  it('returns tie-conflict by default (fail-on-tie) with actionable details', () => {
    const repos = makeRepos([
      ['github.com/org/*', { parentDir: '/tmp/a' }],
      ['github.com/*/repo', { parentDir: '/tmp/b' }],
    ]);

    const result = matchRepo('https://github.com/org/repo', repos);

    expect(result.type).toBe('tie-conflict');

    if (result.type !== 'tie-conflict') {
      throw new Error('Expected tie-conflict result');
    }

    expect(result.patterns).toEqual(['github.com/org/*', 'github.com/*/repo']);
    expect(result.url).toBe('github.com/org/repo');
    expect(result.message).toContain('Multiple patterns match with equal specificity');
    expect(result.message).toContain('first-wins');
    expect(result.message).toContain('last-wins');
  });

  it('uses first-wins strategy when configured', () => {
    const repos = makeRepos([
      ['github.com/org/*', { parentDir: '/tmp/a' }],
      ['github.com/*/repo', { parentDir: '/tmp/b' }],
    ]);

    const result = matchRepo('https://github.com/org/repo', repos, 'first-wins');

    expect(result.type).toBe('first-wins');

    if (result.type !== 'first-wins') {
      throw new Error('Expected first-wins result');
    }

    expect(result.matchedPattern).toBe('github.com/org/*');
    expect(result.settings.parentDir).toBe('/tmp/a');
  });

  it('uses last-wins strategy when configured', () => {
    const repos = makeRepos([
      ['github.com/org/*', { parentDir: '/tmp/a' }],
      ['github.com/*/repo', { parentDir: '/tmp/b' }],
    ]);

    const result = matchRepo('https://github.com/org/repo', repos, 'last-wins');

    expect(result.type).toBe('last-wins');

    if (result.type !== 'last-wins') {
      throw new Error('Expected last-wins result');
    }

    expect(result.matchedPattern).toBe('github.com/*/repo');
    expect(result.settings.parentDir).toBe('/tmp/b');
  });
});
