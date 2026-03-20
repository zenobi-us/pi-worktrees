import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { basename, join } from 'path';
import {
  getWorktreeParentDir,
  git,
  isGitRepo,
  listWorktrees,
  type WorktreeInfo,
} from '../services/git.ts';
import type { CommandDeps } from '../types.ts';

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
  target: WorktreeInfo
): Promise<void> {
  const confirmed = await ctx.ui.confirm(
    'Remove worktree?',
    `This will remove:\n  Path: ${target.path}\n  Branch: ${target.branch}\n\nThe branch will NOT be deleted.`
  );

  if (!confirmed) {
    ctx.ui.notify('Cancelled', 'info');
    return;
  }

  try {
    git(['worktree', 'remove', target.path], cwd);
    ctx.ui.notify(`✓ Worktree removed: ${target.path}`, 'info');
  } catch {
    const forceConfirmed = await ctx.ui.confirm(
      'Force remove?',
      'Worktree has uncommitted changes. Force remove anyway?'
    );

    if (!forceConfirmed) {
      ctx.ui.notify('Cancelled', 'info');
      return;
    }

    try {
      git(['worktree', 'remove', '--force', target.path], cwd);
      ctx.ui.notify(`✓ Worktree force removed: ${target.path}`, 'info');
    } catch (forceErr) {
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

  await removeWorktreeWithConfirm(ctx, ctx.cwd, target);
}
