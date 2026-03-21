import { type Migration } from '@zenobius/pi-extension-config';

const DEFAULT_ONCREATE_DISPLAY_OUTPUT_MAX_LINES = 5;

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return { ...(value as AnyRecord) };
}

export const migration: Migration = {
  id: 'oncreate-display-output-max-lines-default',
  up(config: unknown): AnyRecord {
    const record = toRecord(config);
    if (record.onCreateDisplayOutputMaxLines !== undefined) {
      return record;
    }

    return {
      ...record,
      onCreateDisplayOutputMaxLines: DEFAULT_ONCREATE_DISPLAY_OUTPUT_MAX_LINES,
    };
  },
  down(config: unknown): AnyRecord {
    const record = toRecord(config);
    const next = { ...record };
    delete next.onCreateDisplayOutputMaxLines;
    return next;
  },
};
