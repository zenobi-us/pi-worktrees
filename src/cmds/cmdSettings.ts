import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import type { CommandDeps } from '../types.ts';
import { getConfiguredWorktreeRoot } from '../services/config/schema.ts';

const VALID_SETTING_KEYS = ['worktreeRoot', 'parentDir', 'onCreate'] as const;
type SettingKey = (typeof VALID_SETTING_KEYS)[number];

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
      `worktreeRoot: ${getConfiguredWorktreeRoot(currentSettings) || '(default: {{mainWorktree}}.worktrees)'}`,
      `onCreate:     ${
        Array.isArray(currentSettings.onCreate)
          ? currentSettings.onCreate.join(' && ')
          : (currentSettings.onCreate ?? '(none)')
      }`,
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

  const resolvedKey: 'worktreeRoot' | 'onCreate' = key === 'parentDir' ? 'worktreeRoot' : key;

  if (!value && parts.length === 1) {
    if (resolvedKey === 'worktreeRoot') {
      const currentValue = getConfiguredWorktreeRoot(currentSettings);
      if (currentValue) {
        ctx.ui.notify('worktreeRoot: ' + currentValue, 'info');
        return;
      }

      ctx.ui.notify('worktreeRoot: (default: {{mainWorktree}}.worktrees)', 'info');
      return;
    }

    const currentValue = currentSettings[resolvedKey];
    if (currentValue) {
      const displayValue = Array.isArray(currentValue) ? currentValue.join(' && ') : currentValue;
      ctx.ui.notify(`${resolvedKey}: ${displayValue}`, 'info');
      return;
    }

    const defaults: Record<'worktreeRoot' | 'onCreate', string> = {
      worktreeRoot: '(default: {{mainWorktree}}.worktrees)',
      onCreate: '(none)',
    };
    ctx.ui.notify(`${resolvedKey}: ${defaults[resolvedKey]}`, 'info');
    return;
  }

  const resolvedCurrent = deps.configService.current(ctx) as { matchedPattern?: string };
  const matchedPattern = resolvedCurrent.matchedPattern ?? '**';
  const configuredWorktrees = deps.configService.config.worktrees ?? {};
  const newSettings = { ...(configuredWorktrees[matchedPattern] ?? {}) };
  if (value === '' || value === '""' || value === 'null' || value === 'clear') {
    delete newSettings[resolvedKey];
    delete newSettings.parentDir;
    ctx.ui.notify(`✓ Cleared ${resolvedKey}`, 'info');
  } else {
    newSettings[resolvedKey] = value;
    if (resolvedKey === 'worktreeRoot') {
      delete newSettings.parentDir;
    }
    ctx.ui.notify(`✓ Set ${resolvedKey} = "${value}"`, 'info');
  }

  const nextWorktrees = { ...configuredWorktrees, [matchedPattern]: newSettings };
  if (matchedPattern !== '**' && Object.keys(newSettings).length === 0) {
    delete nextWorktrees[matchedPattern];
  }

  try {
    await deps.configService.save({ worktrees: nextWorktrees });
  } catch (err) {
    ctx.ui.notify(`Failed to save settings: ${(err as Error).message}`, 'error');
  }
}
