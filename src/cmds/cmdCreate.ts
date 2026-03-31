import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { basename, join } from 'path';
import { ensureExcluded, git, isGitRepo, listWorktrees } from '../services/git.ts';
import { runHook, runOnCreateHook } from './shared.ts';
import type { CommandDeps, WorktreeCreatedContext } from '../types.ts';
import { DefaultLogfileTemplate } from '../services/config/config.ts';

function sanitizePathPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]/g, '-');
}

function resolveLogfilePath(
  template: string,
  values: Record<'sessionId' | 'name' | 'timestamp', string>
): string {
  return template
    .replace(/\{\{sessionId\}\}|\{sessionId\}/g, values.sessionId)
    .replace(/\{\{name\}\}|\{name\}/g, values.name)
    .replace(/\{\{timestamp\}\}|\{timestamp\}/g, values.timestamp);
}

// TODO: this needs to be rethought so that we use configService.current(ctx.cwd)
export async function cmdCreate(
  args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  const featureName = args.trim();
  if (!featureName) {
    ctx.ui.notify('Usage: /worktree create <feature-name>', 'error');
    return;
  }

  if (!isGitRepo(ctx.cwd)) {
    ctx.ui.notify('Not in a git repository', 'error');
    return;
  }
  const current = deps.configService.current(ctx);
  const worktreePath = join(current.parentDir, featureName);
  const branchName = `feature/${featureName}`;

  const existingWorktree = listWorktrees(ctx.cwd).find(
    (worktree) =>
      worktree.path === worktreePath ||
      basename(worktree.path) === featureName ||
      worktree.branch === branchName
  );
  if (existingWorktree) {
    if (!ctx.hasUI) {
      ctx.ui.notify(`Worktree already exists at: ${worktreePath}`, 'error');
      return;
    }

    const confirmMessage = current.onSwitch
      ? `Path: ${existingWorktree.path}\nBranch: ${existingWorktree.branch}\n\nSwitch to this worktree and run onSwitch?`
      : `Path: ${existingWorktree.path}\nBranch: ${existingWorktree.branch}\n\nSwitch to this worktree?`;
    const shouldSwitch = await ctx.ui.confirm(
      'Worktree already exists',
      confirmMessage
    );

    if (!shouldSwitch) {
      ctx.ui.notify('Cancelled', 'info');
      return;
    }

    const existingCtx: WorktreeCreatedContext = {
      path: existingWorktree.path,
      name: basename(existingWorktree.path),
      branch: existingWorktree.branch,
      ...current,
    };

    const sessionId = sanitizePathPart(ctx.sessionManager?.getSessionId?.() || 'session');
    const safeName = sanitizePathPart(existingCtx.name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = resolveLogfilePath(current.logfile ?? DefaultLogfileTemplate, {
      sessionId,
      name: safeName,
      timestamp,
    });

    await runHook(existingCtx, current.onSwitch, 'onSwitch', ctx.ui.notify.bind(ctx.ui), {
      logPath,
      displayOutputMaxLines: current.onCreateDisplayOutputMaxLines,
      cmdDisplayPending: current.onCreateCmdDisplayPending,
      cmdDisplaySuccess: current.onCreateCmdDisplaySuccess,
      cmdDisplayError: current.onCreateCmdDisplayError,
      cmdDisplayPendingColor: current.onCreateCmdDisplayPendingColor,
      cmdDisplaySuccessColor: current.onCreateCmdDisplaySuccessColor,
      cmdDisplayErrorColor: current.onCreateCmdDisplayErrorColor,
    });

    ctx.ui.notify(`Worktree path: ${existingWorktree.path}`, 'info');
    return;
  }

  try {
    git(['rev-parse', '--verify', branchName], ctx.cwd);
    ctx.ui.notify(`Branch '${branchName}' already exists. Use a different name.`, 'error');
    return;
  } catch {
    // branch doesn't exist
  }
  ensureExcluded(ctx.cwd, current.parentDir);
  const stopBusy = deps.statusService.busy(ctx, `Creating worktree: ${featureName}...`);
  try {
    git(['worktree', 'add', '-b', branchName, worktreePath], current.mainWorktree);
    stopBusy();
    deps.statusService.positive(ctx, `Created: ${featureName}`);
  } catch (err) {
    stopBusy();
    deps.statusService.critical(ctx, `Failed to create worktree`);
    ctx.ui.notify(`Failed to create worktree: ${(err as Error).message}`, 'error');
    return;
  }
  const createdCtx: WorktreeCreatedContext = {
    path: worktreePath,
    name: featureName,
    branch: branchName,
    ...current,
  };

  const sessionId = sanitizePathPart(ctx.sessionManager?.getSessionId?.() || 'session');
  const safeName = sanitizePathPart(featureName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = resolveLogfilePath(current.logfile ?? DefaultLogfileTemplate, {
    sessionId,
    name: safeName,
    timestamp,
  });
  await runOnCreateHook(createdCtx, current, ctx.ui.notify.bind(ctx.ui), {
    logPath,
    displayOutputMaxLines: current.onCreateDisplayOutputMaxLines,
    cmdDisplayPending: current.onCreateCmdDisplayPending,
    cmdDisplaySuccess: current.onCreateCmdDisplaySuccess,
    cmdDisplayError: current.onCreateCmdDisplayError,
    cmdDisplayPendingColor: current.onCreateCmdDisplayPendingColor,
    cmdDisplaySuccessColor: current.onCreateCmdDisplaySuccessColor,
    cmdDisplayErrorColor: current.onCreateCmdDisplayErrorColor,
  });
}
