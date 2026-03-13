import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import type { CommandDeps } from '../types.ts';
import { WorktreeSettingsConfig } from '../services/config/schema.ts';

export async function cmdInit(
  _args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  if (!ctx.hasUI) {
    ctx.ui.notify('init requires interactive mode', 'error');
    return;
  }

  const currentSettings = deps.settings;

  ctx.ui.notify('Worktree Extension Setup\n━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  if (currentSettings.parentDir || currentSettings.onCreate) {
    const current = [
      'Current settings:',
      currentSettings.parentDir ? `  parentDir: ${currentSettings.parentDir}` : null,
      currentSettings.onCreate ? `  onCreate: ${currentSettings.onCreate}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    ctx.ui.notify(current, 'info');
  }

  const PARENT_DIR_DEFAULT = 'Default (../{{project}}.worktrees/)';
  const PARENT_DIR_GLOBAL = 'Global (~/.local/share/worktrees/{{project}})';
  const PARENT_DIR_CUSTOM = 'Custom path...';
  const PARENT_DIR_KEEP = 'Keep current';

  const parentDirOptions = [
    PARENT_DIR_DEFAULT,
    PARENT_DIR_GLOBAL,
    PARENT_DIR_CUSTOM,
    currentSettings.parentDir ? PARENT_DIR_KEEP : null,
  ].filter(Boolean) as string[];

  const parentDirChoice = await ctx.ui.select(
    'Where should worktrees be created?',
    parentDirOptions
  );

  if (parentDirChoice === undefined) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  let parentDir: string | undefined;

  if (parentDirChoice === PARENT_DIR_DEFAULT) {
    parentDir = undefined;
  } else if (parentDirChoice === PARENT_DIR_GLOBAL) {
    parentDir = '~/.local/share/worktrees/{{project}}';
  } else if (parentDirChoice === PARENT_DIR_CUSTOM) {
    const customPath = await ctx.ui.input(
      'Enter custom path (supports {{project}}, {{name}}):',
      currentSettings.parentDir || '../{{project}}.worktrees'
    );

    if (customPath === undefined) {
      ctx.ui.notify('Setup cancelled', 'info');
      return;
    }

    parentDir = customPath || undefined;
  } else if (parentDirChoice === PARENT_DIR_KEEP) {
    parentDir = currentSettings.parentDir;
  }

  const onCreateDefault = Array.isArray(currentSettings.onCreate)
    ? currentSettings.onCreate.join(' && ')
    : (currentSettings.onCreate ?? 'mise setup');

  const onCreate = await ctx.ui.input(
    'Enter command to run after creating worktree (or leave empty):\nSupports: {{path}}, {{name}}, {{branch}}, {{project}}, {{mainWorktree}}',
    onCreateDefault
  );

  if (onCreate === undefined) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  const newSettings: WorktreeSettingsConfig = {};
  if (parentDir) {
    newSettings.parentDir = parentDir;
  }

  if (onCreate && onCreate.trim()) {
    newSettings.onCreate = onCreate.trim();
  }

  const preview = [
    'Settings to save:',
    '',
    newSettings.parentDir ? `  parentDir: "${newSettings.parentDir}"` : '  parentDir: (default)',
    newSettings.onCreate ? `  onCreate: "${newSettings.onCreate}"` : '  onCreate: (none)',
    '',
  ].join('\n');

  const confirmed = await ctx.ui.confirm('Save settings?', preview);

  if (!confirmed) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  try {
    // TODO: See todo in ./cmds/cmdSettings.ts about saving paradigm

    // await saveWorktreeSettings(deps.configService, { fallback: newSettings }); /
    ctx.ui.notify(`✓ Settings saved`, 'info');

    const finalConfig = JSON.stringify({ worktree: newSettings }, null, 2);
    ctx.ui.notify(`Configuration:\n${finalConfig}`, 'info');
  } catch (err) {
    ctx.ui.notify(`Failed to save settings: ${(err as Error).message}`, 'error');
  }
}
