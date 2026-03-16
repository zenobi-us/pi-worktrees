import { isGitRepo, listWorktrees } from '../services/git.ts';
import { CmdHandler } from '../types.ts';

export const cmdList: CmdHandler = async (_args, ctx, deps) => {
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

  const configured = Array.from(deps.configService.worktrees.entries()).map(
    ([pattern, settings]) => {
      return `${pattern}\n    ${settings.parentDir}\n    ${settings.onCreate}`;
    }
  );

  ctx.ui.notify(
    `Worktrees:\n\n${lines.join('\n\n')} \n\nConfigured:\n\n${configured.join('\n\n')}`,
    'info'
  );
};
