import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import type { CommandDeps } from '../types.ts';
import { saveWorktreeSettings } from '../services/config/config.ts';
import { WorktreeSettingsConfig, getConfiguredWorktreeRoot } from '../services/config/schema.ts';

const VALID_SETTING_KEYS = [
  'worktreeRoot',
  'parentDir',
  'onCreate',
  'onSwitch',
  'onBeforeRemove',
  'branchNameGenerator',
] as const;
type SettingKey = (typeof VALID_SETTING_KEYS)[number];
type ResolvedKey = Exclude<SettingKey, 'parentDir'>;

function formatHookValue(value: WorktreeSettingsConfig['onCreate']): string {
  if (!value) {
    return '(none)';
  }

  return Array.isArray(value) ? value.join(' && ') : value;
}

export async function cmdSettings(
  args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  const currentSettings = deps.settings;

  const parts = args.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
  const key = parts[0]?.trim() as SettingKey | undefined;
  const value = parts
    .slice(1)
    .join(' ')
    .replace(/^"(.*)"$/, '$1');

  if (!key) {
    const lines = [
      'Worktree Settings:',
      '━━━━━━━━━━━━━━━━━━',
      '',
      `worktreeRoot:        ${
        getConfiguredWorktreeRoot(currentSettings) || '(default: {{mainWorktree}}.worktrees)'
      }`,
      `onCreate:            ${formatHookValue(currentSettings.onCreate)}`,
      `onSwitch:            ${formatHookValue(currentSettings.onSwitch)}`,
      `onBeforeRemove:      ${formatHookValue(currentSettings.onBeforeRemove)}`,
      `branchNameGenerator: ${currentSettings.branchNameGenerator ?? '(none)'}`,
      '',
      `Config file: ${deps.configService.getConfigPath('home')}`,
      '',
    ];
    ctx.ui.notify(lines.join('\n'), 'info');
    return;
  }

  if (!VALID_SETTING_KEYS.includes(key)) {
    ctx.ui.notify(
      `Invalid setting key: "${key}"\nValid keys: ${VALID_SETTING_KEYS.join(', ')}`,
      'error'
    );
    return;
  }

  if (key === 'parentDir') {
    ctx.ui.notify('`parentDir` is deprecated. Use `worktreeRoot`.', 'warning');
  }

  const resolvedKey: ResolvedKey = key === 'parentDir' ? 'worktreeRoot' : key;

  if (!value && parts.length === 1) {
    if (resolvedKey === 'worktreeRoot') {
      const currentValue = getConfiguredWorktreeRoot(currentSettings);
      ctx.ui.notify(
        'worktreeRoot: ' + (currentValue || '(default: {{mainWorktree}}.worktrees)'),
        'info'
      );
      return;
    }

    const currentValue = currentSettings[resolvedKey];
    if (currentValue) {
      const displayValue = Array.isArray(currentValue) ? currentValue.join(' && ') : currentValue;
      ctx.ui.notify(`${resolvedKey}: ${displayValue}`, 'info');
      return;
    }

    ctx.ui.notify(`${resolvedKey}: (none)`, 'info');
    return;
  }

  const setFields: WorktreeSettingsConfig = {};
  const clearKeys: (keyof WorktreeSettingsConfig)[] = [];
  let confirmationMessage: string;

  if (value === '' || value === '""' || value === 'null' || value === 'clear') {
    clearKeys.push(resolvedKey);
    if (resolvedKey === 'worktreeRoot') {
      clearKeys.push('parentDir');
    }
    confirmationMessage = `✓ Cleared ${resolvedKey}`;
  } else {
    setFields[resolvedKey] = value;
    if (resolvedKey === 'worktreeRoot') {
      clearKeys.push('parentDir');
    }
    confirmationMessage = `✓ Set ${resolvedKey} = "${value}"`;
  }

  try {
    await saveWorktreeSettings(deps.configService, {
      fallback: { set: setFields, clear: clearKeys },
    });
    ctx.ui.notify(confirmationMessage, 'info');
  } catch (err) {
    ctx.ui.notify(`Failed to save settings: ${(err as Error).message}`, 'error');
  }
}
