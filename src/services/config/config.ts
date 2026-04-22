import { createConfigService } from '@zenobius/pi-extension-config';
import { homedir } from 'node:os';
import path from 'node:path';
import { Parse } from 'typebox/value';

import { migration as migration_01 } from './migrations/01-flat-single.ts';
import { migration as migration_02 } from './migrations/02-worktree-to-worktrees.ts';
import { migration as migration_03 } from './migrations/03-parentDir-to-worktreeRoot.ts';
import { migration as migration_04 } from './migrations/04-oncreate-display-output-max-lines.ts';
import { migration as migration_05 } from './migrations/05-oncreate-command-display-format.ts';
import {
  getMainWorktreePath,
  getProjectName,
  getRemoteUrl,
  getWorktreeParentDir,
  matchRepo,
} from '../git.ts';
import { PiWorktreeConfig, PiWorktreeConfigSchema, WorktreeSettingsConfig } from './schema.ts';

const DEFAULT_LOGFILE_TEMPLATE = '/tmp/pi-worktree-{sessionId}-{name}.log';
const DEFAULT_ONCREATE_DISPLAY_OUTPUT_MAX_LINES = 5;
const DEFAULT_ONCREATE_CMD_DISPLAY_PENDING = '[ ] {{cmd}}';
const DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS = '[x] {{cmd}}';
const DEFAULT_ONCREATE_CMD_DISPLAY_ERROR = '[ ] {{cmd}} [ERROR]';
const DEFAULT_ONCREATE_CMD_DISPLAY_PENDING_COLOR = 'dim';
const DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS_COLOR = 'success';
const DEFAULT_ONCREATE_CMD_DISPLAY_ERROR_COLOR = 'error';

function normalizeConfiguredWorktrees(
  configured: PiWorktreeConfig['worktrees']
): Map<string, WorktreeSettingsConfig> {
  const normalized: Record<string, WorktreeSettingsConfig> = {
    '**': { ...DefaultWorktreeSettings },
  };

  for (const [pattern, settings] of Object.entries(configured || {})) {
    if (pattern === '**') {
      normalized['**'] = {
        ...normalized['**'],
        ...settings,
      };
      continue;
    }

    normalized[pattern] = settings;
  }

  return new Map(Object.entries(normalized));
}
export async function createPiWorktreeConfigService() {
  const parse = (value: unknown) => {
    return Parse(PiWorktreeConfigSchema, value);
  };

  const store = await createConfigService('pi-worktrees', {
    defaults: {},
    parse,
    migrations: [migration_01, migration_02, migration_03, migration_04, migration_05],
  });

  await store.reload();

  const save = async (data: PiWorktreeConfig) => {
    if (data.worktrees !== undefined) {
      await store.set('worktrees', data.worktrees, 'home');
    }

    if (data.matchingStrategy !== undefined) {
      await store.set('matchingStrategy', data.matchingStrategy, 'home');
    }

    if (data.logfile !== undefined) {
      await store.set('logfile', data.logfile, 'home');
    }

    if (data.onCreateDisplayOutputMaxLines !== undefined) {
      await store.set('onCreateDisplayOutputMaxLines', data.onCreateDisplayOutputMaxLines, 'home');
    }

    if (data.onCreateCmdDisplayPending !== undefined) {
      await store.set('onCreateCmdDisplayPending', data.onCreateCmdDisplayPending, 'home');
    }

    if (data.onCreateCmdDisplaySuccess !== undefined) {
      await store.set('onCreateCmdDisplaySuccess', data.onCreateCmdDisplaySuccess, 'home');
    }

    if (data.onCreateCmdDisplayError !== undefined) {
      await store.set('onCreateCmdDisplayError', data.onCreateCmdDisplayError, 'home');
    }

    if (data.onCreateCmdDisplayPendingColor !== undefined) {
      await store.set(
        'onCreateCmdDisplayPendingColor',
        data.onCreateCmdDisplayPendingColor,
        'home'
      );
    }

    if (data.onCreateCmdDisplaySuccessColor !== undefined) {
      await store.set(
        'onCreateCmdDisplaySuccessColor',
        data.onCreateCmdDisplaySuccessColor,
        'home'
      );
    }

    if (data.onCreateCmdDisplayErrorColor !== undefined) {
      await store.set('onCreateCmdDisplayErrorColor', data.onCreateCmdDisplayErrorColor, 'home');
    }

    await store.save('home');
  };

  const worktrees = normalizeConfiguredWorktrees(store.config.worktrees);

  const current = (ctx: { cwd: string }) => {
    const repo = getRemoteUrl(ctx.cwd);
    const resolution = matchRepo(repo, worktrees, store.config.matchingStrategy);

    if (resolution.type === 'tie-conflict') {
      throw new Error(resolution.message);
    }

    const settings = resolution.settings;
    const project = getProjectName(ctx.cwd);
    const mainWorktree = getMainWorktreePath(ctx.cwd);
    const parentDir = getWorktreeParentDir(ctx.cwd, worktrees, store.config.matchingStrategy);

    return {
      ...settings,
      repo,
      project,
      mainWorktree,
      parentDir,
      logfile: store.config.logfile ?? DEFAULT_LOGFILE_TEMPLATE,
      onCreateDisplayOutputMaxLines:
        store.config.onCreateDisplayOutputMaxLines ?? DEFAULT_ONCREATE_DISPLAY_OUTPUT_MAX_LINES,
      onCreateCmdDisplayPending:
        store.config.onCreateCmdDisplayPending ?? DEFAULT_ONCREATE_CMD_DISPLAY_PENDING,
      onCreateCmdDisplaySuccess:
        store.config.onCreateCmdDisplaySuccess ?? DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS,
      onCreateCmdDisplayError:
        store.config.onCreateCmdDisplayError ?? DEFAULT_ONCREATE_CMD_DISPLAY_ERROR,
      onCreateCmdDisplayPendingColor:
        store.config.onCreateCmdDisplayPendingColor ?? DEFAULT_ONCREATE_CMD_DISPLAY_PENDING_COLOR,
      onCreateCmdDisplaySuccessColor:
        store.config.onCreateCmdDisplaySuccessColor ?? DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS_COLOR,
      onCreateCmdDisplayErrorColor:
        store.config.onCreateCmdDisplayErrorColor ?? DEFAULT_ONCREATE_CMD_DISPLAY_ERROR_COLOR,
      matchedPattern: resolution.matchedPattern,
    };
  };

  const getConfigPath = (scope: 'home' | 'project' = 'home'): string => {
    // Mirrors the file layout used by @zenobius/pi-extension-config.
    if (scope === 'home') {
      return path.join(homedir(), '.pi', 'agent', 'pi-worktrees.config.json');
    }

    return path.join(process.cwd(), '.pi', 'pi-worktrees.config.json');
  };

  // Direct access to the underlying store's save (the service's own `save`
  // wrapper takes a full config object and is kept for backwards compatibility).
  const persist = (scope: 'home' | 'project' = 'home') => store.save(scope);

  const service = {
    ...store,
    worktrees,
    current,
    save,
    persist,
    getConfigPath,
  };

  return service;
}

type WorktreeSettingsKey = keyof WorktreeSettingsConfig;

type PatternUpdate = {
  set?: WorktreeSettingsConfig;
  clear?: WorktreeSettingsKey[];
};

function applyPatternUpdate(
  existing: WorktreeSettingsConfig | undefined,
  update: PatternUpdate
): WorktreeSettingsConfig {
  const base: WorktreeSettingsConfig = { ...(existing ?? {}) };

  if (update.clear) {
    for (const key of update.clear) {
      delete base[key];
    }
  }

  if (update.set) {
    for (const [key, value] of Object.entries(update.set) as [
      WorktreeSettingsKey,
      WorktreeSettingsConfig[WorktreeSettingsKey],
    ][]) {
      if (value === undefined) {
        delete base[key];
        continue;
      }

      (base as Record<string, unknown>)[key] = value;
    }
  }

  return base;
}

/**
 * Merge and persist worktree settings without requiring callers to reason about
 * the full `PiWorktreeConfig` shape. Accepts either a fallback settings update
 * (written to the `"**"` pattern) and/or explicit per-pattern overrides.
 *
 * Each update can both set keys (`set`) and clear keys (`clear`). Clears are
 * applied first, so a caller can atomically swap a key's value.
 *
 * `scope` defaults to `'home'`; `'project'` is accepted for future UI support
 * but is not yet surfaced through `/worktree` commands.
 */
export async function saveWorktreeSettings(
  configService: PiWorktreeConfigService,
  update: {
    fallback?: PatternUpdate;
    repo?: Record<string, PatternUpdate>;
    scope?: 'home' | 'project';
  }
): Promise<void> {
  const current = configService.config.worktrees ?? {};
  const next: Record<string, WorktreeSettingsConfig> = { ...current };

  if (update.fallback) {
    next['**'] = applyPatternUpdate(next['**'], update.fallback);
  }

  if (update.repo) {
    for (const [pattern, patternUpdate] of Object.entries(update.repo)) {
      next[pattern] = applyPatternUpdate(next[pattern], patternUpdate);
    }
  }

  const scope = update.scope ?? 'home';
  await configService.set('worktrees', next, scope);
  await configService.persist(scope);
  await configService.reload();
}

export const DefaultWorktreeSettings: WorktreeSettingsConfig = {
  worktreeRoot: '{{mainWorktree}}.worktrees',
  onCreate: 'echo "Created {{path}}"',
};

export const DefaultLogfileTemplate = DEFAULT_LOGFILE_TEMPLATE;
export const DefaultOnCreateDisplayOutputMaxLines = DEFAULT_ONCREATE_DISPLAY_OUTPUT_MAX_LINES;
export const DefaultOnCreateCmdDisplayPending = DEFAULT_ONCREATE_CMD_DISPLAY_PENDING;
export const DefaultOnCreateCmdDisplaySuccess = DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS;
export const DefaultOnCreateCmdDisplayError = DEFAULT_ONCREATE_CMD_DISPLAY_ERROR;
export const DefaultOnCreateCmdDisplayPendingColor = DEFAULT_ONCREATE_CMD_DISPLAY_PENDING_COLOR;
export const DefaultOnCreateCmdDisplaySuccessColor = DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS_COLOR;
export const DefaultOnCreateCmdDisplayErrorColor = DEFAULT_ONCREATE_CMD_DISPLAY_ERROR_COLOR;
export type PiWorktreeConfigService = Awaited<ReturnType<typeof createPiWorktreeConfigService>>;
export type PiWorktreeConfiguredWorktreeMap = PiWorktreeConfigService['worktrees'];
