import { createConfigService } from '@zenobius/pi-extension-config';
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

  const service = {
    ...store,
    worktrees,
    current,
    save,
  };

  return service;
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
