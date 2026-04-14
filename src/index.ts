/**
 * Worktree Extension - Git worktree management for isolated workspaces
 *
 * Provides commands to create, list, and manage git worktrees for feature development.
 * Codifies the patterns from the using-git-worktrees skill into an interactive command.
 */

import type { ExtensionFactory } from '@mariozechner/pi-coding-agent';
import type { CmdHandler } from './types.ts';
import { cmdCd } from './cmds/cmdCd.ts';
import { cmdCreate } from './cmds/cmdCreate.ts';
import { cmdInit } from './cmds/cmdInit.ts';
import { cmdList } from './cmds/cmdList.ts';
import { cmdPrune } from './cmds/cmdPrune.ts';
import { cmdRemove } from './cmds/cmdRemove.ts';
import { cmdSettings } from './cmds/cmdSettings.ts';
import { cmdStatus } from './cmds/cmdStatus.ts';
import { cmdTemplates } from './cmds/cmdTemplates.ts';
import { createPiWorktreeConfigService } from './services/config/config.ts';
import { createCompletionFactory } from './services/completions.ts';
import { StatusIndicator } from './ui/status.ts';

const HELP_TEXT = `
/worktree - Git worktree management

Commands:
  /worktree init                   Configure worktree settings interactively
  /worktree settings [key] [val]   Get/set individual settings
  /worktree create <branch> [--name <worktree-name>]  Create new worktree from branch
  /worktree create --generate [--name <worktree-name>] <prompt-or-name>  Generate branch via config command
  /worktree list                   List worktrees and run onSwitch for a selection
  /worktree remove <name>          Remove a worktree (runs onBeforeRemove if set)
  /worktree status                 Show current worktree info
  /worktree cd <name>              Print path to worktree
  /worktree prune                  Clean up stale references
  /worktree templates              Show template variables preview

Configuration (~/.pi/agent/pi-worktrees.config.json):
  {
    "worktrees": {
      "github.com/org/repo": {
        "worktreeRoot": "~/work/org",
        "onCreate": ["mise install", "bun install"],
        "onSwitch": "mise run dev:resume",
        "onBeforeRemove": "bun test",
        "branchNameGenerator": "pi -p 'branch name for $PI_WORKTREE_PROMPT' --model local/model",
      },
      "github.com/org/*": {
        "worktreeRoot": "~/work/org-other",
        "onCreate": "make setup"
      }
    },
    "matchingStrategy": "fail-on-tie",
    "logfile": "/tmp/pi-worktree-{sessionId}-{name}.log",
    "onCreateDisplayOutputMaxLines": 5,
    "onCreateCmdDisplayPending": "[ ] {{cmd}}",
    "onCreateCmdDisplaySuccess": "[x] {{cmd}}",
    "onCreateCmdDisplayError": "[ ] {{cmd}} [ERROR]",
    "onCreateCmdDisplayPendingColor": "dim",
    "onCreateCmdDisplaySuccessColor": "success",
    "onCreateCmdDisplayErrorColor": "error",
    "worktree": {
      "worktreeRoot": "~/.worktrees/{{project}}",
      "onCreate": "mise setup"
    }
  }

Pattern matching: exact URL > most-specific glob > fallback (worktree)
Matching strategies: fail-on-tie | first-wins | last-wins

Config note: parentDir is deprecated and supported as an alias for worktreeRoot.
Naming note: default worktree name is slugify(branch); explicit '--name' takes precedence.
Generator note: '--generate' is explicit opt-in and requires branchNameGenerator config.
Generated branch output must be valid and is never used unless --generate is present.
Migration note: legacy '/worktree create <feature-name>' is deprecated and now treats token as branch.
Use '/worktree create feature/<name> --name <name>' to preserve old semantics.
Hook vars: {{path}}, {{name}}, {{branch}}, {{project}}, {{mainWorktree}}
Hooks: onCreate (new), onSwitch (existing), onBeforeRemove (pre-delete, non-zero blocks)
Logfile vars: {sessionId} / {{sessionId}}, {name} / {{name}}, {timestamp} / {{timestamp}}
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
  templates: cmdTemplates,
  vars: cmdTemplates,
  tokens: cmdTemplates,
};

const PiWorktreeExtension: ExtensionFactory = async function (pi) {
  const configService = await createPiWorktreeConfigService();
  const statusService = new StatusIndicator('pi-worktree');
  const getSubcommandCompletions = createCompletionFactory(commands);

  pi.registerCommand('worktree', {
    description: 'Git worktree management for isolated workspaces',
    getArgumentCompletions(argumentPrefix) {
      return getSubcommandCompletions(argumentPrefix);
    },
    handler: async (args, ctx) => {
      const [cmd, ...rest] = args.trim().split(/\s+/);
      const command = commands[cmd];

      if (!command) {
        ctx.ui.notify(HELP_TEXT, 'info');
        return;
      }

      try {
        await configService.reload();
        const settings = configService.current(ctx);
        await command(rest.join(' '), ctx, {
          settings,
          configService,
          statusService,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        ctx.ui.notify(`Worktree command failed: ${message}`, 'error');
      }
    },
  });
};

export default PiWorktreeExtension;
