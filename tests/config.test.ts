import { describe, expect, it, vi } from 'vitest';
import { configMigrations } from '../src/services/config/migrations/01-flat-single.ts';
import {
  normalizeConfig,
  saveWorktreeSettings,
  type MatchingStrategy,
  type WorktreeConfigService,
  type WorktreeSettingsConfig,
} from '../src/services/config.ts';

describe('normalizeConfig', () => {
  it('parses worktrees map and defaults missing values', () => {
    const config = normalizeConfig({
      worktrees: {
        'github.com/org/repo': { parentDir: '~/work' },
      },
    });

    expect(config.worktrees['github.com/org/repo']).toEqual({ parentDir: '~/work' });
    expect(config.matchingStrategy).toBe('fail-on-tie');
    expect(config.fallback).toEqual({});
  });

  it('supports onCreate as string and array', () => {
    const fromString = normalizeConfig({
      worktree: { onCreate: 'mise setup' },
    });
    expect(fromString.fallback.onCreate).toBe('mise setup');

    const fromArray = normalizeConfig({
      worktree: { onCreate: ['mise install', 'bun install'] },
    });
    expect(fromArray.fallback.onCreate).toEqual(['mise install', 'bun install']);
  });

  it('supports legacy flat keys and nested precedence', () => {
    const flat = normalizeConfig({ parentDir: '~/flat', onCreate: 'echo flat' });
    expect(flat.fallback).toEqual({ parentDir: '~/flat', onCreate: 'echo flat' });

    const nestedWins = normalizeConfig({
      parentDir: '~/flat',
      onCreate: 'echo flat',
      worktree: { parentDir: '~/nested', onCreate: 'echo nested' },
    });

    expect(nestedWins.fallback).toEqual({ parentDir: '~/nested', onCreate: 'echo nested' });
  });

  it('validates matchingStrategy enum', () => {
    expect(normalizeConfig({ matchingStrategy: 'fail-on-tie' }).matchingStrategy).toBe(
      'fail-on-tie'
    );
    expect(normalizeConfig({ matchingStrategy: 'first-wins' }).matchingStrategy).toBe('first-wins');
    expect(normalizeConfig({ matchingStrategy: 'last-wins' }).matchingStrategy).toBe('last-wins');

    expect(() => normalizeConfig({ matchingStrategy: 'invalid' })).toThrow();
  });
});

describe('saveWorktreeSettings', () => {
  it('persists worktrees strategy and fallback in compatible keys', async () => {
    const set = vi.fn(async () => {});
    const save = vi.fn(async () => {});

    const configService = {
      set,
      save,
    } as unknown as WorktreeConfigService;

    const worktrees: Record<string, WorktreeSettingsConfig> = {
      'github.com/org/repo': { parentDir: '~/repo' },
    };
    const matchingStrategy: MatchingStrategy = 'first-wins';
    const fallback: WorktreeSettingsConfig = { parentDir: '~/fallback', onCreate: 'mise setup' };

    await saveWorktreeSettings(configService, { worktrees, matchingStrategy, fallback });

    expect(set).toHaveBeenCalledWith('worktrees', worktrees, 'home');
    expect(set).toHaveBeenCalledWith('matchingStrategy', matchingStrategy, 'home');
    expect(set).toHaveBeenCalledWith('worktree', fallback, 'home');
    expect(save).toHaveBeenCalledWith('home');
  });
});

describe('configMigrations', () => {
  it('migrates legacy flat keys into worktree', async () => {
    const migration = configMigrations[0];

    const migrated = await migration.up({
      parentDir: '~/legacy-flat',
      onCreate: 'mise setup',
      matchingStrategy: 'first-wins',
    });

    expect(migrated).toEqual({
      worktree: {
        parentDir: '~/legacy-flat',
        onCreate: 'mise setup',
      },
      matchingStrategy: 'first-wins',
    });
  });

  it('restores legacy flat keys on down migration', async () => {
    const migration = configMigrations[0];

    const reverted = await migration.down({
      worktree: {
        parentDir: '~/fallback',
        onCreate: ['mise install', 'bun install'],
      },
      worktrees: {
        'github.com/org/repo': {
          parentDir: '~/repo',
        },
      },
    });

    expect(reverted).toEqual({
      parentDir: '~/fallback',
      onCreate: ['mise install', 'bun install'],
      worktrees: {
        'github.com/org/repo': {
          parentDir: '~/repo',
        },
      },
    });
  });
});
