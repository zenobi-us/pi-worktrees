import { type Migration } from '@zenobius/pi-extension-config';

const DEFAULT_ONCREATE_CMD_DISPLAY_PENDING = '[ ] {{cmd}}';
const DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS = '[x] {{cmd}}';
const DEFAULT_ONCREATE_CMD_DISPLAY_ERROR = '[ ] {{cmd}} [ERROR]';

const DEFAULT_ONCREATE_CMD_DISPLAY_PENDING_COLOR = 'dim';
const DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS_COLOR = 'success';
const DEFAULT_ONCREATE_CMD_DISPLAY_ERROR_COLOR = 'error';

type AnyRecord = Record<string, unknown>;

function toRecord(value: unknown): AnyRecord {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return { ...(value as AnyRecord) };
}

export const migration: Migration = {
  id: 'oncreate-command-display-format-defaults',
  up(config: unknown): AnyRecord {
    const record = toRecord(config);

    const next = { ...record };

    if (next.onCreateCmdDisplayPending === undefined) {
      next.onCreateCmdDisplayPending = DEFAULT_ONCREATE_CMD_DISPLAY_PENDING;
    }

    if (next.onCreateCmdDisplaySuccess === undefined) {
      next.onCreateCmdDisplaySuccess = DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS;
    }

    if (next.onCreateCmdDisplayError === undefined) {
      next.onCreateCmdDisplayError = DEFAULT_ONCREATE_CMD_DISPLAY_ERROR;
    }

    if (next.onCreateCmdDisplayPendingColor === undefined) {
      next.onCreateCmdDisplayPendingColor = DEFAULT_ONCREATE_CMD_DISPLAY_PENDING_COLOR;
    }

    if (next.onCreateCmdDisplaySuccessColor === undefined) {
      next.onCreateCmdDisplaySuccessColor = DEFAULT_ONCREATE_CMD_DISPLAY_SUCCESS_COLOR;
    }

    if (next.onCreateCmdDisplayErrorColor === undefined) {
      next.onCreateCmdDisplayErrorColor = DEFAULT_ONCREATE_CMD_DISPLAY_ERROR_COLOR;
    }

    return next;
  },
  down(config: unknown): AnyRecord {
    const record = toRecord(config);
    const next = { ...record };

    delete next.onCreateCmdDisplayPending;
    delete next.onCreateCmdDisplaySuccess;
    delete next.onCreateCmdDisplayError;
    delete next.onCreateCmdDisplayPendingColor;
    delete next.onCreateCmdDisplaySuccessColor;
    delete next.onCreateCmdDisplayErrorColor;

    return next;
  },
};
