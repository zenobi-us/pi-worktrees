import { createConfigService, type ConfigService } from '@zenobius/pi-extension-config';
import { Object as TypeObject, Optional, Static, String as TypeString } from 'typebox';
import { Parse } from 'typebox/value';

const APP_NAME = 'pi-worktrees';

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
    worktree: buildWorktreeSettings(parsed),
  });
}

export async function createWorktreeConfigService(): Promise<WorktreeConfigService> {
  return createConfigService<ResolvedConfig>(APP_NAME, {
    defaults: {
      worktree: {},
    },
    parse: normalizeConfig,
  });
}

export async function saveWorktreeSettings(
  configService: WorktreeConfigService,
  worktreeSettings: WorktreeSettingsConfig
): Promise<void> {
  const persistable: WorktreeSettingsConfig = {};

  if (worktreeSettings.parentDir !== undefined) {
    persistable.parentDir = worktreeSettings.parentDir;
  }

  if (typeof worktreeSettings.onCreate === 'string') {
    persistable.onCreate = worktreeSettings.onCreate;
  }

  await configService.set('worktree', persistable, 'home');
  await configService.save('home');
}
