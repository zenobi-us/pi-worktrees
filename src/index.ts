/**
 * Worktree Extension - Git worktree management for isolated workspaces
 *
 * Provides commands to create, list, and manage git worktrees for feature development.
 * Codifies the patterns from the using-git-worktrees skill into an interactive command.
 */

import type { ExtensionFactory } from '@mariozechner/pi-coding-agent';
import { cmdCd } from './cmds/cmdCd.ts';
import { cmdCreate } from './cmds/cmdCreate.ts';
import { cmdInit } from './cmds/cmdInit.ts';
import { cmdList } from './cmds/cmdList.ts';
import { cmdPrune } from './cmds/cmdPrune.ts';
import { cmdRemove } from './cmds/cmdRemove.ts';
import { cmdSettings } from './cmds/cmdSettings.ts';
import { cmdStatus } from './cmds/cmdStatus.ts';
import { createWorktreeConfigService } from './services/config.ts';
import { getRemoteUrl } from './services/git.ts';
import { isTieConflict, matchRepo } from './services/repoMatcher.ts';
import type { CmdHandler } from './types.ts';

const HELP_TEXT = `
/worktree - Git worktree management

Commands:
  /worktree init                   Configure worktree settings interactively
  /worktree settings [key] [val]   Get/set individual settings
  /worktree create <feature-name>  Create new worktree with branch
  /worktree list                   List all worktrees
  /worktree remove <name>          Remove a worktree
  /worktree status                 Show current worktree info
  /worktree cd <name>              Print path to worktree
  /worktree prune                  Clean up stale references

Configuration (~/.pi/agent/pi-worktrees-settings.json):
  {
    "worktrees": {
      "github.com/org/repo": {
        "parentDir": "~/work/org",
        "onCreate": ["mise install", "bun install"]
      },
      "github.com/org/*": {
        "parentDir": "~/work/org-other",
        "onCreate": "make setup"
      }
    },
    "matchingStrategy": "fail-on-tie",
    "worktree": {
      "parentDir": "~/.worktrees/{{project}}",
      "onCreate": "mise setup"
    }
  }

Pattern matching: exact URL > most-specific glob > fallback (worktree)
Matching strategies: fail-on-tie | first-wins | last-wins

Template vars: {{path}}, {{name}}, {{branch}}, {{project}}
`.trim();

const commands: Record<string, CmdHandler> = {
  init: cmdInit,
  settings: cmdSettings,
  config: cmdSettings,
  create: cmdCreate,
  list: cmdList,
  ls: cmdList,
  remove: cmdRemove,
  rm: cmdRemove,
  status: cmdStatus,
  cd: cmdCd,
  prune: cmdPrune,
};

const PiWorktreeExtension: ExtensionFactory = function (pi) {
  const configServicePromise = createWorktreeConfigService();

  pi.registerCommand('worktree', {
    description: 'Git worktree management for isolated workspaces',
    handler: async (args, ctx) => {
      const [cmd, ...rest] = args.trim().split(/\s+/);
      const command = commands[cmd];

      if (!command) {
        ctx.ui.notify(HELP_TEXT, 'info');
        return;
      }

      const configService = await configServicePromise;
      await configService.reload();

      const remoteUrl = getRemoteUrl(ctx.cwd);
      let settings = configService.config.fallback;

      if (remoteUrl) {
        const matchResult = matchRepo(remoteUrl, configService.config);

        if (isTieConflict(matchResult)) {
          ctx.ui.notify(`Config Error: ${matchResult.message}`, 'error');
          return;
        }

        settings = matchResult.settings;
      }

      await command(rest.join(' '), ctx, {
        settings,
        configService,
      });
    },
  });
};

export default PiWorktreeExtension;
