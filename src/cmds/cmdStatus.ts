import type { ExtensionCommandContext } from '@earendil-works/pi-coding-agent';
import {
  getCurrentBranch,
  getMainWorktreePath,
  getProjectName,
  isGitRepo,
  isWorktree,
  listWorktrees,
} from '../services/git.ts';

export async function cmdStatus(_args: string, ctx: ExtensionCommandContext): Promise<void> {
  if (!isGitRepo(ctx.cwd)) {
    ctx.ui.notify('Not in a git repository', 'error');
    return;
  }

  const isWt = isWorktree(ctx.cwd);
  const mainPath = getMainWorktreePath(ctx.cwd);
  const project = getProjectName(ctx.cwd);
  const branch = getCurrentBranch(ctx.cwd);
  const worktrees = listWorktrees(ctx.cwd);

  const status = [
    `Project: ${project}`,
    `Current path: ${ctx.cwd}`,
    `Branch: ${branch}`,
    `Is worktree: ${isWt ? 'Yes' : 'No (main repository)'}`,
    `Main worktree: ${mainPath}`,
    `Total worktrees: ${worktrees.length}`,
  ];

  ctx.ui.notify(status.join('\n'), 'info');
}
