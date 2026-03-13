import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { basename, join } from 'path';
import { getWorktreeParentDir, git, isGitRepo, listWorktrees } from '../services/git.ts';
import type { CommandDeps } from '../types.ts';

export async function cmdRemove(
  args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  const worktreeName = args.trim();
  if (!worktreeName) {
    ctx.ui.notify('Usage: /worktree remove <name>', 'error');
    return;
  }

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

  const target = worktrees.find(
    (worktree) =>
      basename(worktree.path) === worktreeName ||
      worktree.path === worktreeName ||
      worktree.path === join(parentDir, worktreeName)
  );

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

  const confirmed = await ctx.ui.confirm(
    'Remove worktree?',
    `This will remove:\n  Path: ${target.path}\n  Branch: ${target.branch}\n\nThe branch will NOT be deleted.`
  );

  if (!confirmed) {
    ctx.ui.notify('Cancelled', 'info');
    return;
  }

  try {
    git(['worktree', 'remove', target.path], ctx.cwd);
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
      git(['worktree', 'remove', '--force', target.path], ctx.cwd);
      ctx.ui.notify(`✓ Worktree force removed: ${target.path}`, 'info');
    } catch (forceErr) {
      ctx.ui.notify(`Failed to remove: ${(forceErr as Error).message}`, 'error');
    }
  }
}
