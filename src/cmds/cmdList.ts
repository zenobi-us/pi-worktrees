import { basename } from 'path';
import { DefaultLogfileTemplate } from '../services/config/config.ts';
import { isGitRepo, listWorktrees, type WorktreeInfo } from '../services/git.ts';
import type { CmdHandler, WorktreeCreatedContext } from '../types.ts';
import { runHook } from './shared.ts';

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

function formatWorktreeOption(worktree: WorktreeInfo): string {
  const markers = [worktree.isMain ? '[main]' : '', worktree.isCurrent ? '[current]' : '']
    .filter(Boolean)
    .join(' ');

  return `${worktree.branch}${markers ? ' ' + markers : ''}\n  ${worktree.path}`;
}

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

  if (!ctx.hasUI) {
    const lines = worktrees.map((worktree) => {
      const markers = [worktree.isMain ? '[main]' : '', worktree.isCurrent ? '[current]' : '']
        .filter(Boolean)
        .join(' ');

      return `${worktree.branch}${markers ? ' ' + markers : ''}\n    ${worktree.path}`;
    });

    const configured = Array.from(deps.configService.worktrees.entries()).map(
      ([pattern, settings]) => {
        return `${pattern}\n    ${settings.worktreeRoot ?? settings.parentDir}\n    ${settings.onCreate}`;
      }
    );

    ctx.ui.notify(
      `Worktrees:\n\n${lines.join('\n\n')} \n\nConfigured:\n\n${configured.join('\n\n')}`,
      'info'
    );
    return;
  }

  const options = worktrees.map(formatWorktreeOption);
  const byOption = new Map(options.map((option, index) => [option, worktrees[index]]));
  const selected = await ctx.ui.select('Select worktree to switch to', options);

  if (selected === undefined) {
    ctx.ui.notify('Cancelled', 'info');
    return;
  }

  const target = byOption.get(selected);
  if (!target) {
    ctx.ui.notify('Invalid selection', 'error');
    return;
  }

  const current = deps.configService.current({ cwd: target.path });

  if (!current.onSwitch) {
    ctx.ui.notify(`No onSwitch configured for: ${target.path}`, 'info');
    return;
  }

  const sessionId = sanitizePathPart(ctx.sessionManager?.getSessionId?.() || 'session');
  const safeName = sanitizePathPart(basename(target.path));
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = resolveLogfilePath(current.logfile ?? DefaultLogfileTemplate, {
    sessionId,
    name: safeName,
    timestamp,
  });

  const createdCtx: WorktreeCreatedContext = {
    path: target.path,
    name: basename(target.path),
    branch: target.branch,
    project: current.project,
    mainWorktree: current.mainWorktree,
  };

  const stopBusy = deps.statusService.busy(ctx, `Running onSwitch for ${target.branch}...`);

  try {
    const result = await runHook(
      createdCtx,
      current.onSwitch,
      'onSwitch',
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

    if (!result.success) {
      stopBusy();
      deps.statusService.critical(ctx, `onSwitch failed`);
      ctx.ui.notify(`onSwitch failed`, 'error');
      return;
    }

    stopBusy();
    deps.statusService.positive(ctx, `onSwitch complete: ${target.branch}`);
  } catch (err) {
    stopBusy();
    deps.statusService.critical(ctx, `onSwitch failed`);
    ctx.ui.notify(`onSwitch failed: ${(err as Error).message}`, 'error');
  }
};
