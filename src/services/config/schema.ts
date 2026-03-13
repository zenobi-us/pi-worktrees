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

export const OnCreateSchema = Union([TypeString(), TypeArray(TypeString())]);

export const WorktreeSettingsSchema = TypeObject(
  {
    parentDir: Optional(TypeString()),
    onCreate: Optional(OnCreateSchema),
  },
  {
    $id: 'WorktreeSettingsConfig',
    additionalProperties: false,
  }
);

export const MatchingStrategySchema = Union([
  Literal('fail-on-tie'),
  Literal('first-wins'),
  Literal('last-wins'),
]);

export const WorktreesMapSchema = TypeRecord(TypeString(), WorktreeSettingsSchema);

export const UnresolvedConfigSchema = TypeObject(
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

export const ResolvedConfigSchema = TypeObject(
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
export type UnresolvedConfig = Static<typeof UnresolvedConfigSchema>;
export type ResolvedConfig = Static<typeof ResolvedConfigSchema>;
