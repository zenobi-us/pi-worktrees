import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { git, isGitRepo } from '../services/git.ts';
import type { CommandDeps } from '../types.ts';

export async function cmdPrune(
  _args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  if (!isGitRepo(ctx.cwd)) {
    ctx.ui.notify('Not in a git repository', 'error');
    return;
  }

  let dryRun: string;
  try {
    dryRun = git(['worktree', 'prune', '--dry-run'], ctx.cwd);
  } catch (err) {
    ctx.ui.notify(`Failed to check stale worktrees: ${(err as Error).message}`, 'error');
    return;
  }

  if (!dryRun.trim()) {
    ctx.ui.notify('No stale worktree references to prune', 'info');
    return;
  }

  const confirmed = await ctx.ui.confirm(
    'Prune stale worktrees?',
    `The following stale references will be removed:\n\n${dryRun}`
  );

  if (!confirmed) {
    ctx.ui.notify('Cancelled', 'info');
    return;
  }

  const stopBusy = deps.statusService.busy(ctx, 'Pruning stale worktrees...');
  try {
    git(['worktree', 'prune'], ctx.cwd);
    stopBusy();
    deps.statusService.positive(ctx, 'Pruned stale references');
    ctx.ui.notify('✓ Stale worktree references pruned', 'info');
  } catch (err) {
    stopBusy();
    deps.statusService.critical(ctx, 'Failed to prune');
    ctx.ui.notify(`Failed to prune: ${(err as Error).message}`, 'error');
  }
}
