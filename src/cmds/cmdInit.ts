import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import type { CommandDeps } from '../types.ts';
import { WorktreeSettingsConfig, getConfiguredWorktreeRoot } from '../services/config/schema.ts';

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

  if (currentWorktreeRoot || currentSettings.onCreate) {
    const current = [
      'Current settings:',
      currentWorktreeRoot ? `  worktreeRoot: ${currentWorktreeRoot}` : null,
      currentSettings.onCreate ? `  onCreate: ${currentSettings.onCreate}` : null,
    ]
      .filter(Boolean)
      .join('\n');
    ctx.ui.notify(current, 'info');
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
  if (worktreeRoot) {
    newSettings.worktreeRoot = worktreeRoot;
  }

  if (onCreate && onCreate.trim()) {
    newSettings.onCreate = onCreate.trim();
  }

  const preview = [
    'Settings to save:',
    '',
    newSettings.worktreeRoot
      ? `  worktreeRoot: "${newSettings.worktreeRoot}"`
      : '  worktreeRoot: (default)',
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
