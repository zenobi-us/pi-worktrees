import { createConfigService, type ConfigService } from '@zenobius/pi-extension-config';
import {
  Array as TypeArray,
  Literal,
  Object as TypeObject,
  Optional,
  Record as TypeRecord,
  Static,
  String as TypeString,
  Union,
} from 'typebox';
import { Parse } from 'typebox/value';

const APP_NAME = 'pi-worktrees';

const OnCreateSchema = Union([TypeString(), TypeArray(TypeString())]);

const WorktreeSettingsSchema = TypeObject(
  {
    parentDir: Optional(TypeString()),
    onCreate: Optional(OnCreateSchema),
  },
  {
    $id: 'WorktreeSettingsConfig',
    additionalProperties: false,
  }
);

const MatchingStrategySchema = Union([
  Literal('fail-on-tie'),
  Literal('first-wins'),
  Literal('last-wins'),
]);

const WorktreesMapSchema = TypeRecord(TypeString(), WorktreeSettingsSchema);

const UnresolvedConfigSchema = TypeObject(
  {
    worktrees: Optional(WorktreesMapSchema),
    matchingStrategy: Optional(MatchingStrategySchema),
    worktree: Optional(WorktreeSettingsSchema),
    // legacy flat shape support
    parentDir: Optional(TypeString()),
    onCreate: Optional(OnCreateSchema),
  },
  {
    $id: 'UnresolvedConfig',
    additionalProperties: true,
  }
);

type UnresolvedConfig = Static<typeof UnresolvedConfigSchema>;

const ResolvedConfigSchema = TypeObject(
  {
    worktrees: WorktreesMapSchema,
    matchingStrategy: MatchingStrategySchema,
    fallback: WorktreeSettingsSchema,
  },
  {
    $id: 'ResolvedConfig',
    additionalProperties: false,
  }
);

export type WorktreeSettingsConfig = Static<typeof WorktreeSettingsSchema>;
export type MatchingStrategy = Static<typeof MatchingStrategySchema>;
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
    worktrees: parsed.worktrees ?? {},
    matchingStrategy: parsed.matchingStrategy ?? 'fail-on-tie',
    fallback: buildWorktreeSettings(parsed),
  });
}

export async function createWorktreeConfigService(): Promise<WorktreeConfigService> {
  return createConfigService<ResolvedConfig>(APP_NAME, {
    defaults: {},
    parse: normalizeConfig,
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
