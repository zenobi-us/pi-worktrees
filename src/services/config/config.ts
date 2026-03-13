import { createConfigService, type ConfigService } from '@zenobius/pi-extension-config';
import { Parse } from 'typebox/value';
import { configMigrations } from './migrations/01-flat-single.ts';
import {
  ResolvedConfigSchema,
  UnresolvedConfigSchema,
  type MatchingStrategy,
  type ResolvedConfig,
  type UnresolvedConfig,
  type WorktreeSettingsConfig,
} from './schema.ts';

const APP_NAME = 'pi-worktrees';

export type { MatchingStrategy, ResolvedConfig, WorktreeSettingsConfig };
export type WorktreeConfigService = ConfigService<ResolvedConfig>;

function buildWorktreeSettings(config: UnresolvedConfig): WorktreeSettingsConfig {
  const nested = config.worktree || {};
  const parentDir = nested.parentDir ?? config.parentDir;
  const onCreate = nested.onCreate ?? config.onCreate;

  const next: WorktreeSettingsConfig = {};

  if (parentDir !== undefined) {
    next.parentDir = parentDir;
  }

  if (onCreate !== undefined) {
    next.onCreate = onCreate;
  }

  return next;
}

export function normalizeConfig(value: unknown): ResolvedConfig {
  const parsed = Parse(UnresolvedConfigSchema, value);

  return Parse(ResolvedConfigSchema, {
    worktrees: parsed.worktrees ?? {},
    matchingStrategy: parsed.matchingStrategy ?? 'fail-on-tie',
    fallback: buildWorktreeSettings(parsed),
  });
}

export async function createWorktreeConfigService(): Promise<WorktreeConfigService> {
  return createConfigService<ResolvedConfig>(APP_NAME, {
    defaults: {},
    parse: normalizeConfig,
    migrations: configMigrations,
  });
}

export async function saveWorktreeSettings(
  configService: WorktreeConfigService,
  settings: {
    worktrees?: Record<string, WorktreeSettingsConfig>;
    matchingStrategy?: MatchingStrategy;
    fallback?: WorktreeSettingsConfig;
  }
): Promise<void> {
  if (settings.worktrees !== undefined) {
    await configService.set('worktrees', settings.worktrees, 'home');
  }

  if (settings.matchingStrategy !== undefined) {
    await configService.set('matchingStrategy', settings.matchingStrategy, 'home');
  }

  if (settings.fallback !== undefined) {
    await configService.set('worktree', settings.fallback, 'home');
  }

  await configService.save('home');
}
