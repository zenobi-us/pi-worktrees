import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { basename, join } from 'path';
import {
  getWorktreeParentDir,
  git,
  isGitRepo,
  listWorktrees,
  type WorktreeInfo,
} from '../services/git.ts';
import type { CommandDeps, WorktreeCreatedContext } from '../types.ts';
import type { StatusIndicator } from '../ui/status.ts';
import { runHook } from './shared.ts';
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
function findTarget(
  worktrees: WorktreeInfo[],
  worktreeName: string,
  parentDir: string
): WorktreeInfo | undefined {
  return worktrees.find(
    (worktree) =>
      basename(worktree.path) === worktreeName ||
      worktree.path === worktreeName ||
      worktree.path === join(parentDir, worktreeName)
  );
}

function isProtectedWorktree(worktree: WorktreeInfo): boolean {
  return worktree.isMain || worktree.isCurrent;
}

async function pickWorktreeInteractively(
  ctx: ExtensionCommandContext,
  worktrees: WorktreeInfo[]
): Promise<WorktreeInfo | undefined> {
  const candidates = worktrees.filter((worktree) => !isProtectedWorktree(worktree));

  if (candidates.length === 0) {
    ctx.ui.notify('No removable worktrees found', 'info');
    return undefined;
  }

  const options = candidates.map(
    (worktree) => `${basename(worktree.path)} (${worktree.branch})\n  ${worktree.path}`
  );
  const byOption = new Map(options.map((option, index) => [option, candidates[index]]));

  const selected = await ctx.ui.select('Select worktree to remove', options);

  if (selected === undefined) {
    ctx.ui.notify('Cancelled', 'info');
    return undefined;
  }

  return byOption.get(selected);
}

async function removeWorktreeWithConfirm(
  ctx: ExtensionCommandContext,
  cwd: string,
  target: WorktreeInfo,
  status: StatusIndicator,
  runBeforeRemove?: () => Promise<boolean>
): Promise<void> {
  const confirmed = await ctx.ui.confirm(
    'Remove worktree?',
    `This will remove:\n  Path: ${target.path}\n  Branch: ${target.branch}\n\nThe branch will NOT be deleted.`
  );

  if (!confirmed) {
    ctx.ui.notify('Cancelled', 'info');
    return;
  }

  if (runBeforeRemove) {
    const canContinue = await runBeforeRemove();
    if (!canContinue) {
      return;
    }
  }

  const stopBusy = status.busy(ctx, 'Removing worktree...');
  try {
    git(['worktree', 'remove', target.path], cwd);
    stopBusy();
    status.positive(ctx, `Removed: ${target.path}`);
    ctx.ui.notify(`✓ Worktree removed: ${target.path}`, 'info');
  } catch {
    stopBusy();
    const forceConfirmed = await ctx.ui.confirm(
      'Force remove?',
      'Worktree has uncommitted changes. Force remove anyway?'
    );
    if (!forceConfirmed) {
      ctx.ui.notify('Cancelled', 'info');
      return;
    }

    const stopForceBusy = status.busy(ctx, 'Force removing worktree...');
    try {
      git(['worktree', 'remove', '--force', target.path], cwd);
      stopForceBusy();
      status.positive(ctx, `Force removed: ${target.path}`);
      ctx.ui.notify(`✓ Worktree force removed: ${target.path}`, 'info');
    } catch (forceErr) {
      stopForceBusy();
      status.critical(ctx, `Failed to remove`);
      ctx.ui.notify(`Failed to remove: ${(forceErr as Error).message}`, 'error');
    }
  }
}

export async function cmdRemove(
  args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  const worktreeName = args.trim();

  if (!isGitRepo(ctx.cwd)) {
    ctx.ui.notify('Not in a git repository', 'error');
    return;
  }

  const worktrees = listWorktrees(ctx.cwd);
  const parentDir = getWorktreeParentDir(
    ctx.cwd,
    deps.configService.worktrees,
    deps.configService.config.matchingStrategy
  );

  let target: WorktreeInfo | undefined;

  if (!worktreeName) {
    if (!ctx.hasUI) {
      ctx.ui.notify('Usage: /worktree remove <name>', 'error');
      return;
    }

    target = await pickWorktreeInteractively(ctx, worktrees);
    if (!target) {
      return;
    }
  } else {
    target = findTarget(worktrees, worktreeName, parentDir);
    if (!target) {
      ctx.ui.notify(`Worktree not found: ${worktreeName}`, 'error');
      return;
    }

    if (target.isMain) {
      ctx.ui.notify('Cannot remove the main worktree', 'error');
      return;
    }

    if (target.isCurrent) {
      ctx.ui.notify('Cannot remove the current worktree. Switch to another first.', 'error');
      return;
    }
  }

  const current = deps.configService.current({ cwd: target.path });

  await removeWorktreeWithConfirm(ctx, ctx.cwd, target, deps.statusService, async () => {
    if (!current.onBeforeRemove) {
      return true;
    }

    const hookCtx: WorktreeCreatedContext = {
      path: target.path,
      name: basename(target.path),
      branch: target.branch,
      project: current.project,
      mainWorktree: current.mainWorktree,
    };

    const sessionId = sanitizePathPart(ctx.sessionManager?.getSessionId?.() || 'session');
    const safeName = sanitizePathPart(hookCtx.name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = resolveLogfilePath(current.logfile ?? DefaultLogfileTemplate, {
      sessionId,
      name: safeName,
      timestamp,
    });

    const result = await runHook(
      hookCtx,
      current.onBeforeRemove,
      'onBeforeRemove',
      ctx.ui.notify.bind(ctx.ui),
      {
        logPath,
        displayOutputMaxLines: current.onCreateDisplayOutputMaxLines,
        cmdDisplayPending: current.onCreateCmdDisplayPending,
        cmdDisplaySuccess: current.onCreateCmdDisplaySuccess,
        cmdDisplayError: current.onCreateCmdDisplayError,
        cmdDisplayPendingColor: current.onCreateCmdDisplayPendingColor,
        cmdDisplaySuccessColor: current.onCreateCmdDisplaySuccessColor,
        cmdDisplayErrorColor: current.onCreateCmdDisplayErrorColor,
      }
    );

    return result.success;
  });
}
