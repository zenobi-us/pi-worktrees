import {
  Array as TypeArray,
  Literal,
  Object as TypeObject,
  Optional,
  Record as TypeRecord,
  Static,
  String as TypeString,
  Union,
  Integer as TypeInteger,
} from 'typebox';

const HookCommandsSchema = Union([TypeString(), TypeArray(TypeString())]);

const WorktreeSettingsSchema = TypeObject(
  {
    worktreeRoot: Optional(TypeString()),
    parentDir: Optional(TypeString()),
    onCreate: Optional(HookCommandsSchema),
    onSwitch: Optional(HookCommandsSchema),
    onBeforeRemove: Optional(HookCommandsSchema),
    branchNameGenerator: Optional(TypeString()),
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

// TODO: join this with MatchingStrategySchema
const MatchStrategyResultSchema = Union([Literal('exact'), Literal('unmatched')]);

const WorktreesMapSchema = TypeRecord(TypeString(), WorktreeSettingsSchema);
const LogfileSchema = TypeString();
const OnCreateDisplayOutputMaxLinesSchema = TypeInteger({ minimum: 0 });
const OnCreateCmdDisplayPendingSchema = TypeString();
const OnCreateCmdDisplaySuccessSchema = TypeString();
const OnCreateCmdDisplayErrorSchema = TypeString();
const OnCreateCmdDisplayPendingColorSchema = TypeString();
const OnCreateCmdDisplaySuccessColorSchema = TypeString();
const OnCreateCmdDisplayErrorColorSchema = TypeString();

export const PiWorktreeConfigSchema = TypeObject(
  {
    worktrees: Optional(WorktreesMapSchema),
    matchingStrategy: Optional(MatchingStrategySchema),
    logfile: Optional(LogfileSchema),
    onCreateDisplayOutputMaxLines: Optional(OnCreateDisplayOutputMaxLinesSchema),
    onCreateCmdDisplayPending: Optional(OnCreateCmdDisplayPendingSchema),
    onCreateCmdDisplaySuccess: Optional(OnCreateCmdDisplaySuccessSchema),
    onCreateCmdDisplayError: Optional(OnCreateCmdDisplayErrorSchema),
    onCreateCmdDisplayPendingColor: Optional(OnCreateCmdDisplayPendingColorSchema),
    onCreateCmdDisplaySuccessColor: Optional(OnCreateCmdDisplaySuccessColorSchema),
    onCreateCmdDisplayErrorColor: Optional(OnCreateCmdDisplayErrorColorSchema),
  },
  {
    $id: 'UnresolvedConfig',
    additionalProperties: true,
  }
);

export type WorktreeSettingsConfig = Static<typeof WorktreeSettingsSchema>;
export type MatchingStrategy = Static<typeof MatchingStrategySchema>;
export type MatchingStrategyResult = Static<typeof MatchStrategyResultSchema>;
export type PiWorktreeConfig = Static<typeof PiWorktreeConfigSchema>;
export type PiWorktreeRecord = NonNullable<PiWorktreeConfig['worktrees']>;
export type PiWorktreeLogTemplate = NonNullable<PiWorktreeConfig['logfile']>;

export function getConfiguredWorktreeRoot(settings: WorktreeSettingsConfig): string | undefined {
  return settings.worktreeRoot ?? settings.parentDir;
}
