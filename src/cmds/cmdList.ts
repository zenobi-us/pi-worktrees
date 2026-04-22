import { basename } from 'path';
import { DefaultLogfileTemplate } from '../services/config/config.ts';
import { isGitRepo, listWorktrees, type WorktreeInfo } from '../services/git.ts';
import type { CmdHandler, WorktreeCreatedContext } from '../types.ts';
import { resolveLogfilePath, runHook, sanitizePathPart } from './shared.ts';

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
  const selected = await ctx.ui.select('Select a worktree', options);

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
    ctx.ui.notify(
      [
        `Worktree path: ${target.path}`,
        `Branch:        ${target.branch}`,
        '',
        'Note: in this version of the extension, /worktree list does not',
        'redirect the running pi session to the selected worktree. It runs',
        'your onSwitch hook (if configured) and prints the path.',
        '',
        'To work in this worktree, either:',
        `  • exit and run: cd ${target.path} && pi`,
        '  • configure an onSwitch hook that spawns pi there in a new',
        '    terminal/tab, e.g.:',
        "      /worktree settings onSwitch 'zellij action new-tab --cwd {{path}} -- pi'",
        `      (or: tmux new-window -c {{path}} pi)`,
        '',
        'See /worktree init for an interactive setup, or the README for details.',
      ].join('\n'),
      'info'
    );
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
    ctx.ui.notify(
      `onSwitch finished. Note: this pi session has not been moved to ${target.path} — in this version of the extension, onSwitch is expected to have opened pi there in a separate tab/window/pane.`,
      'info'
    );
  } catch (err) {
    stopBusy();
    deps.statusService.critical(ctx, `onSwitch failed`);
    ctx.ui.notify(`onSwitch failed: ${(err as Error).message}`, 'error');
  }
};
