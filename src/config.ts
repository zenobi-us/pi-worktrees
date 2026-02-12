import { existsSync, mkdirSync, writeFileSync } from 'fs';
import nconf from 'nconf';
import { homedir } from 'os';
import path from 'path';
import { Object as TypeObject, Optional, Static, String as TypeString } from 'typebox';
import { Parse } from 'typebox/value';

const APP_NAME = 'pi-worktrees';
const ENV_PREFIX = `${APP_NAME.toUpperCase().replace(/-/g, '_')}_`;

export const SETTINGS_FILE_PATH = path.join(
  homedir(),
  '.pi',
  'agent',
  'pi-worktrees-settings.json'
);

const WorktreeSettingsSchema = TypeObject(
  {
    parentDir: Optional(TypeString()),
    onCreate: Optional(TypeString()),
  },
  {
    $id: 'WorktreeSettingsConfig',
    additionalProperties: false,
  }
);

export type WorktreeSettingsConfig = Static<typeof WorktreeSettingsSchema>;

const UnresolvedConfigSchema = TypeObject(
  {
    worktree: Optional(WorktreeSettingsSchema),
    // legacy flat shape support
    parentDir: Optional(TypeString()),
    onCreate: Optional(TypeString()),
  },
  {
    $id: 'UnresolvedConfig',
    additionalProperties: true,
  }
);

type UnresolvedConfig = Static<typeof UnresolvedConfigSchema>;

const ResolvedConfigSchema = TypeObject(
  {
    worktree: WorktreeSettingsSchema,
  },
  {
    $id: 'ResolvedConfig',
    additionalProperties: false,
  }
);

export type ResolvedConfig = Static<typeof ResolvedConfigSchema>;

nconf
  .env({
    separator: '__',
    match: new RegExp(`^${ENV_PREFIX}`),
  })
  .file({
    file: SETTINGS_FILE_PATH,
  })
  .defaults({
    worktree: {},
  });

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
    worktree: buildWorktreeSettings(parsed),
  });
}

function readConfig(): ResolvedConfig {
  return normalizeConfig(nconf.get());
}

export let Config: ResolvedConfig = readConfig();

export function getWorktreeSettings(): WorktreeSettingsConfig {
  return Config.worktree;
}

export function saveWorktreeSettings(worktreeSettings: WorktreeSettingsConfig): ResolvedConfig {
  const normalized = normalizeConfig({
    worktree: worktreeSettings,
  });

  const settingsDir = path.dirname(SETTINGS_FILE_PATH);
  if (!existsSync(settingsDir)) {
    mkdirSync(settingsDir, { recursive: true });
  }

  writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(normalized, null, 2) + '\n', 'utf-8');

  nconf.load();
  Config = readConfig();

  return Config;
}

/*
 * Reload values from env + config file and return the normalized config snapshot.
 */
export function reloadConfig(): ResolvedConfig {
  nconf.load();
  Config = readConfig();
  return Config;
}
