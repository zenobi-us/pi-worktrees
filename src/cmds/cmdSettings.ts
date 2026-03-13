import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import type { CommandDeps } from '../types.ts';

const VALID_SETTING_KEYS = ['parentDir', 'onCreate'] as const;
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
      `parentDir: ${currentSettings.parentDir || '(default: ../<project>.worktrees/)'}`,
      `onCreate:  ${
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

  if (!value && parts.length === 1) {
    const currentValue = currentSettings[key];
    if (currentValue) {
      const displayValue = Array.isArray(currentValue) ? currentValue.join(' && ') : currentValue;
      ctx.ui.notify(`${key}: ${displayValue}`, 'info');
      return;
    }

    const defaults: Record<SettingKey, string> = {
      parentDir: '(default: ../<project>.worktrees/)',
      onCreate: '(none)',
    };
    ctx.ui.notify(`${key}: ${defaults[key]}`, 'info');
    return;
  }

  const newSettings = { ...currentSettings };

  if (value === '' || value === '""' || value === 'null' || value === 'clear') {
    delete newSettings[key];
    ctx.ui.notify(`✓ Cleared ${key}`, 'info');
  } else {
    newSettings[key] = value;
    ctx.ui.notify(`✓ Set ${key} = "${value}"`, 'info');
  }

  //TODO: this used to assume settings was about a single repo/worktree.
  // but it now needs to think about:
  // - are we saving entire settings?
  // - are we saving settings for a repo? new, existing ?
  try {
    // await deps.configService.save(newSettings);
  } catch (err) {
    ctx.ui.notify(`Failed to save settings: ${(err as Error).message}`, 'error');
  }
}
