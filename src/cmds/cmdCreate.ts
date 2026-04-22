import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { basename, join } from 'path';
import { ensureExcluded, git, isGitRepo, listWorktrees } from '../services/git.ts';
import { resolveLogfilePath, runHook, runOnCreateHook, sanitizePathPart } from './shared.ts';
import type { CommandDeps, WorktreeCreatedContext } from '../types.ts';
import { DefaultLogfileTemplate } from '../services/config/config.ts';
import { parseCreateCommandArgs } from './createArgs.ts';
import { generateBranchName } from '../services/branchNameGenerator.ts';

// TODO: this needs to be rethought so that we use configService.current(ctx.cwd)
export async function cmdCreate(
  args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  const parsed = parseCreateCommandArgs(args);
  if ('error' in parsed) {
    ctx.ui.notify(parsed.error, 'error');
    return;
  }

  const worktreeName = parsed.worktreeName;
  if (!isGitRepo(ctx.cwd)) {
    ctx.ui.notify('Not in a git repository', 'error');
    return;
  }

  const current = deps.configService.current(ctx);

  let branchName = parsed.generate ? '' : parsed.branch;
  if (parsed.generate) {
    const generated = await generateBranchName({
      commandTemplate: current.branchNameGenerator,
      input: parsed.generatorInput,
      cwd: ctx.cwd,
    });

    if (!generated.ok) {
      ctx.ui.notify(generated.message, 'error');
      return;
    }

    branchName = generated.branchName;
    ctx.ui.notify(
      `Using generated branch '${branchName}' from branchNameGenerator (input: '${parsed.generatorInput}').`,
      'info'
    );
  }

  if (!parsed.generate && parsed.showLegacyWarning) {
    ctx.ui.notify(
      `Legacy create style detected: '/worktree create <feature-name>' is deprecated. '${branchName}' is now treated as the branch name. If you want old semantics, run '/worktree create feature/${branchName}' (optionally '--name ${branchName}').`,
      'warning'
    );
  }

  const worktreePath = join(current.parentDir, worktreeName);

  const existingWorktree = listWorktrees(ctx.cwd).find(
    (worktree) =>
      worktree.path === worktreePath ||
      basename(worktree.path) === worktreeName ||
      worktree.branch === branchName
  );
  if (existingWorktree) {
    if (!ctx.hasUI) {
      ctx.ui.notify(`Worktree already exists at: ${worktreePath}`, 'error');
      return;
    }

    const confirmMessage = current.onSwitch
      ? `Path: ${existingWorktree.path}\nBranch: ${existingWorktree.branch}\n\nRun onSwitch for this worktree?`
      : `Path: ${existingWorktree.path}\nBranch: ${existingWorktree.branch}\n\nShow this worktree's path? (This version of the extension does not redirect the running pi session; configure an onSwitch hook to open pi in this worktree automatically.)`;
    const shouldSwitch = await ctx.ui.confirm('Worktree already exists', confirmMessage);

    if (!shouldSwitch) {
      ctx.ui.notify('Cancelled', 'info');
      return;
    }

    const existingCtx: WorktreeCreatedContext = {
      path: existingWorktree.path,
      name: basename(existingWorktree.path),
      branch: existingWorktree.branch,
      ...current,
    };

    const sessionId = sanitizePathPart(ctx.sessionManager?.getSessionId?.() || 'session');
    const safeName = sanitizePathPart(existingCtx.name);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const logPath = resolveLogfilePath(current.logfile ?? DefaultLogfileTemplate, {
      sessionId,
      name: safeName,
      timestamp,
    });

    const result = await runHook(
      existingCtx,
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
      ctx.ui.notify('onSwitch failed', 'error');
      return;
    }
    ctx.ui.notify(`Worktree path: ${existingWorktree.path}`, 'info');
    if (current.onSwitch) {
      ctx.ui.notify(
        `onSwitch finished. Note: this pi session has not been moved to ${existingWorktree.path} — in this version of the extension, onSwitch is expected to have opened pi there in a separate tab/window/pane.`,
        'info'
      );
    } else {
      ctx.ui.notify(
        [
          'Note: in this version of the extension, /worktree create does not',
          'redirect the running pi session to the selected worktree.',
          'To work in this worktree, either:',
          `  • exit and run: cd ${existingWorktree.path} && pi`,
          '  • configure /worktree settings onSwitch "<command that spawns pi in a new tab/window>"',
        ].join('\n'),
        'info'
      );
    }
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
  const stopBusy = deps.statusService.busy(ctx, `Creating worktree: ${worktreeName}...`);
  try {
    git(['worktree', 'add', '-b', branchName, worktreePath], current.mainWorktree);
    stopBusy();
    deps.statusService.positive(ctx, `Created: ${worktreeName}`);
  } catch (err) {
    stopBusy();
    deps.statusService.critical(ctx, `Failed to create worktree`);
    ctx.ui.notify(`Failed to create worktree: ${(err as Error).message}`, 'error');
    return;
  }

  const createdCtx: WorktreeCreatedContext = {
    path: worktreePath,
    name: worktreeName,
    branch: branchName,
    ...current,
  };

  const sessionId = sanitizePathPart(ctx.sessionManager?.getSessionId?.() || 'session');
  const safeName = sanitizePathPart(worktreeName);
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const logPath = resolveLogfilePath(current.logfile ?? DefaultLogfileTemplate, {
    sessionId,
    name: safeName,
    timestamp,
  });

  await runOnCreateHook(createdCtx, current, ctx.ui.notify.bind(ctx.ui), {
    logPath,
    displayOutputMaxLines: current.onCreateDisplayOutputMaxLines,
    cmdDisplayPending: current.onCreateCmdDisplayPending,
    cmdDisplaySuccess: current.onCreateCmdDisplaySuccess,
    cmdDisplayError: current.onCreateCmdDisplayError,
    cmdDisplayPendingColor: current.onCreateCmdDisplayPendingColor,
    cmdDisplaySuccessColor: current.onCreateCmdDisplaySuccessColor,
    cmdDisplayErrorColor: current.onCreateCmdDisplayErrorColor,
  });
}
