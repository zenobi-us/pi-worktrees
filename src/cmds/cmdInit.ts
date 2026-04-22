import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import type { CommandDeps } from '../types.ts';
import { saveWorktreeSettings } from '../services/config/config.ts';
import { WorktreeSettingsConfig, getConfiguredWorktreeRoot } from '../services/config/schema.ts';

function formatHookValue(value: WorktreeSettingsConfig['onCreate']): string {
  if (!value) {
    return '';
  }

  return Array.isArray(value) ? value.join(' && ') : value;
}

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
  const currentWorktreeRoot = getConfiguredWorktreeRoot(currentSettings);

  ctx.ui.notify('Worktree Extension Setup\n━━━━━━━━━━━━━━━━━━━━━━━━', 'info');

  const currentLines = [
    'Current settings:',
    currentWorktreeRoot ? `  worktreeRoot: ${currentWorktreeRoot}` : null,
    currentSettings.onCreate ? `  onCreate: ${formatHookValue(currentSettings.onCreate)}` : null,
    currentSettings.onSwitch ? `  onSwitch: ${formatHookValue(currentSettings.onSwitch)}` : null,
    currentSettings.onBeforeRemove
      ? `  onBeforeRemove: ${formatHookValue(currentSettings.onBeforeRemove)}`
      : null,
    currentSettings.branchNameGenerator
      ? `  branchNameGenerator: ${currentSettings.branchNameGenerator}`
      : null,
  ].filter(Boolean) as string[];

  if (currentLines.length > 1) {
    ctx.ui.notify(currentLines.join('\n'), 'info');
  }

  const PARENT_DIR_DEFAULT = 'Default ({{mainWorktree}}.worktrees)';
  const PARENT_DIR_GLOBAL = 'Global (~/.local/share/worktrees/{{project}})';
  const PARENT_DIR_CUSTOM = 'Custom path...';
  const PARENT_DIR_KEEP = 'Keep current';

  const parentDirOptions = [
    PARENT_DIR_DEFAULT,
    PARENT_DIR_GLOBAL,
    PARENT_DIR_CUSTOM,
    currentWorktreeRoot ? PARENT_DIR_KEEP : null,
  ].filter(Boolean) as string[];

  const parentDirChoice = await ctx.ui.select(
    'Where should worktrees be created?',
    parentDirOptions
  );

  if (parentDirChoice === undefined) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  let worktreeRoot: string | undefined;

  if (parentDirChoice === PARENT_DIR_DEFAULT) {
    worktreeRoot = undefined;
  } else if (parentDirChoice === PARENT_DIR_GLOBAL) {
    worktreeRoot = '~/.local/share/worktrees/{{project}}';
  } else if (parentDirChoice === PARENT_DIR_CUSTOM) {
    const customPath = await ctx.ui.input(
      'Enter custom path (supports {{project}}, {{name}}):',
      currentWorktreeRoot || '{{mainWorktree}}.worktrees'
    );

    if (customPath === undefined) {
      ctx.ui.notify('Setup cancelled', 'info');
      return;
    }

    worktreeRoot = customPath || undefined;
  } else if (parentDirChoice === PARENT_DIR_KEEP) {
    worktreeRoot = currentWorktreeRoot;
  }

  const onCreateDefault = formatHookValue(currentSettings.onCreate) || 'mise setup';

  const onCreate = await ctx.ui.input(
    'Enter command to run after creating a new worktree (or leave empty):\nSupports: {{path}}, {{name}}, {{branch}}, {{project}}, {{mainWorktree}}',
    onCreateDefault
  );

  if (onCreate === undefined) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  const onSwitchDefault = formatHookValue(currentSettings.onSwitch);

  const onSwitch = await ctx.ui.input(
    'Enter command to run when switching to an existing worktree (or leave empty):\nSupports: {{path}}, {{name}}, {{branch}}, {{project}}, {{mainWorktree}}',
    onSwitchDefault
  );

  if (onSwitch === undefined) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  const onBeforeRemoveDefault = formatHookValue(currentSettings.onBeforeRemove);

  const onBeforeRemove = await ctx.ui.input(
    'Enter command to run before removing a worktree (non-zero exit blocks removal, or leave empty):\nSupports: {{path}}, {{name}}, {{branch}}, {{project}}, {{mainWorktree}}',
    onBeforeRemoveDefault
  );

  if (onBeforeRemove === undefined) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  const newSettings: WorktreeSettingsConfig = {};
  const clearKeys: (keyof WorktreeSettingsConfig)[] = [];

  if (worktreeRoot) {
    newSettings.worktreeRoot = worktreeRoot;
  } else {
    clearKeys.push('worktreeRoot', 'parentDir');
  }

  const trimmedOnCreate = onCreate.trim();
  if (trimmedOnCreate) {
    newSettings.onCreate = trimmedOnCreate;
  } else {
    clearKeys.push('onCreate');
  }

  const trimmedOnSwitch = onSwitch.trim();
  if (trimmedOnSwitch) {
    newSettings.onSwitch = trimmedOnSwitch;
  } else {
    clearKeys.push('onSwitch');
  }

  const trimmedOnBeforeRemove = onBeforeRemove.trim();
  if (trimmedOnBeforeRemove) {
    newSettings.onBeforeRemove = trimmedOnBeforeRemove;
  } else {
    clearKeys.push('onBeforeRemove');
  }

  const preview = [
    'Settings to save:',
    '',
    newSettings.worktreeRoot
      ? `  worktreeRoot: "${newSettings.worktreeRoot}"`
      : '  worktreeRoot: (default)',
    newSettings.onCreate ? `  onCreate: "${newSettings.onCreate}"` : '  onCreate: (none)',
    newSettings.onSwitch ? `  onSwitch: "${newSettings.onSwitch}"` : '  onSwitch: (none)',
    newSettings.onBeforeRemove
      ? `  onBeforeRemove: "${newSettings.onBeforeRemove}"`
      : '  onBeforeRemove: (none)',
    '',
    `Target file: ${deps.configService.getConfigPath('home')}`,
    '',
  ].join('\n');

  const confirmed = await ctx.ui.confirm('Save settings?', preview);

  if (!confirmed) {
    ctx.ui.notify('Setup cancelled', 'info');
    return;
  }

  try {
    await saveWorktreeSettings(deps.configService, {
      fallback: { set: newSettings, clear: clearKeys },
    });
    ctx.ui.notify(`✓ Settings saved to ${deps.configService.getConfigPath('home')}`, 'info');
  } catch (err) {
    ctx.ui.notify(`Failed to save settings: ${(err as Error).message}`, 'error');
  }
}
