import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { isGitRepo, listWorktrees } from '../services/git.ts';

export async function cmdList(_args: string, ctx: ExtensionCommandContext): Promise<void> {
  if (!isGitRepo(ctx.cwd)) {
    ctx.ui.notify('Not in a git repository', 'error');
    return;
  }

  const worktrees = listWorktrees(ctx.cwd);

  if (worktrees.length === 0) {
    ctx.ui.notify('No worktrees found', 'info');
    return;
  }

  const lines = worktrees.map((worktree) => {
    const markers = [worktree.isMain ? '[main]' : '', worktree.isCurrent ? '[current]' : '']
      .filter(Boolean)
      .join(' ');

    return `${worktree.branch}${markers ? ' ' + markers : ''}\n    ${worktree.path}`;
  });

  ctx.ui.notify(`Worktrees:\n\n${lines.join('\n\n')}`, 'info');
}
