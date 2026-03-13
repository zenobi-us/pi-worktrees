import { type Migration } from '@zenobius/pi-extension-config';
import {
  Array as TypeArray,
  Object as TypeObject,
  Optional,
  Static,
  String as TypeString,
  Union,
} from 'typebox';
import { Parse } from 'typebox/value';

const LegacyOnCreateSchema = Union([TypeString(), TypeArray(TypeString())]);

const LegacyWorktreeSettingsSchema = TypeObject(
  {
    parentDir: Optional(TypeString()),
    onCreate: Optional(LegacyOnCreateSchema),
  },
  {
    additionalProperties: true,
  }
);

const LegacyConfigSchema = TypeObject(
  {
    parentDir: Optional(TypeString()),
    onCreate: Optional(LegacyOnCreateSchema),
    worktree: Optional(LegacyWorktreeSettingsSchema),
  },
  {
    additionalProperties: true,
  }
);

type LegacyConfig = Static<typeof LegacyConfigSchema>;

function toRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return { ...(value as Record<string, unknown>) };
}

function getFallbackSettings(config: LegacyConfig): Record<string, unknown> {
  const nested = config.worktree ?? {};

  const fallback: Record<string, unknown> = {};
  if (nested.parentDir !== undefined) {
    fallback.parentDir = nested.parentDir;
  } else if (config.parentDir !== undefined) {
    fallback.parentDir = config.parentDir;
  }

  if (nested.onCreate !== undefined) {
    fallback.onCreate = nested.onCreate;
  } else if (config.onCreate !== undefined) {
    fallback.onCreate = config.onCreate;
  }

  return fallback;
}

export const configMigrations: Migration[] = [
  {
    id: 'legacy-flat-worktree-settings',
    up(config: unknown): Record<string, unknown> {
      const record = toRecord(config);
      const parsed = Parse(LegacyConfigSchema, record);
      const fallback = getFallbackSettings(parsed);

      const next = { ...record };
      if (Object.keys(fallback).length > 0) {
        next.worktree = fallback;
      }

      delete next.parentDir;
      delete next.onCreate;

      return next;
    },
    down(config: unknown): Record<string, unknown> {
      const record = toRecord(config);
      const parsed = Parse(LegacyConfigSchema, record);
      const worktree = toRecord(parsed.worktree);

      const next = { ...record };
      if (worktree.parentDir !== undefined) {
        next.parentDir = worktree.parentDir;
      }

      if (worktree.onCreate !== undefined) {
        next.onCreate = worktree.onCreate;
      }

      delete next.worktree;
      return next;
    },
  },
];
