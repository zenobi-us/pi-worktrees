import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { join } from 'path';
import { ensureExcluded, git, isGitRepo, listWorktrees } from '../services/git.ts';
import { runOnCreateHook } from './shared.ts';
import type { CommandDeps, WorktreeCreatedContext } from '../types.ts';

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

  const existing = listWorktrees(ctx.cwd);
  if (existing.some((worktree) => worktree.path === worktreePath)) {
    ctx.ui.notify(`Worktree already exists at: ${worktreePath}`, 'error');
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

  ctx.ui.notify(`Creating worktree: ${featureName}`, 'info');

  try {
    git(['worktree', 'add', '-b', branchName, worktreePath], current.mainWorktree);
  } catch (err) {
    ctx.ui.notify(`Failed to create worktree: ${(err as Error).message}`, 'error');
    return;
  }

  const createdCtx: WorktreeCreatedContext = {
    path: worktreePath,
    name: featureName,
    branch: branchName,
    ...current,
  };

  await runOnCreateHook(createdCtx, current, ctx.ui.notify.bind(ctx.ui));

  ctx.ui.notify(`✓ Worktree created!\n  Path: ${worktreePath}\n  Branch: ${branchName}`, 'info');
}
