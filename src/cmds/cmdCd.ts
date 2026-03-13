import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { basename, join } from 'path';
import { isGitRepo, listWorktrees } from '../services/git.ts';
import type { CommandDeps } from '../types.ts';

export async function cmdCd(
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
  const current = deps.configService.current(ctx);

  if (!worktreeName) {
    const main = worktrees.find((worktree) => worktree.isMain);
    if (main) {
      ctx.ui.notify(`Main worktree: ${main.path}`, 'info');
    }
    return;
  }

  const target = worktrees.find(
    (worktree) =>
      basename(worktree.path) === worktreeName ||
      worktree.path === worktreeName ||
      worktree.path === join(current.parentDir, worktreeName)
  );

  if (!target) {
    ctx.ui.notify(`Worktree not found: ${worktreeName}`, 'error');
    return;
  }

  ctx.ui.notify(`Worktree path: ${target.path}`, 'info');
}
