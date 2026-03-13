import type { ExtensionCommandContext } from '@mariozechner/pi-coding-agent';
import { join } from 'path';
import {
  getCurrentBranch,
  getMainWorktreePath,
  getProjectName,
  getWorktreeParentDir,
  isGitRepo,
} from '../services/git.ts';
import { expandTemplate } from '../services/templates.ts';
import type { CommandDeps } from '../types.ts';
import { createTemplatePreviewComponent, type TemplateToken } from '../ui/templatePreview.ts';

const SAMPLE_FEATURE_NAME = 'sample-feature';

function buildPlainLines(
  cwd: string,
  currentBranch: string,
  parentDirTemplate: string,
  parentDirPreview: string,
  tokens: TemplateToken[]
): string[] {
  return [
    'Template Variables Preview',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━',
    '',
    `Current cwd: ${cwd}`,
    `Current branch: ${currentBranch}`,
    `Parent dir template: ${parentDirTemplate}`,
    `Parent dir resolved now: ${parentDirPreview}`,
    '',
    ...tokens.map((item) => `${item.token.padEnd(16)} = ${item.value}\n  source: ${item.source}`),
    '',
    'Notes:',
    '  - {{name}}, {{branch}}, {{path}} are create-time values.',
    `  - This command uses generated data for them (${SAMPLE_FEATURE_NAME}).`,
  ];
}

export async function cmdTemplates(
  _args: string,
  ctx: ExtensionCommandContext,
  deps: CommandDeps
): Promise<void> {
  if (!isGitRepo(ctx.cwd)) {
    ctx.ui.notify('Not in a git repository', 'error');
    return;
  }

  const project = getProjectName(ctx.cwd);
  const mainWorktree = getMainWorktreePath(ctx.cwd);
  const currentBranch = getCurrentBranch(ctx.cwd);
  const generatedName = SAMPLE_FEATURE_NAME;
  const generatedBranch = `feature/${generatedName}`;
  const parentDir = getWorktreeParentDir(
    ctx.cwd,
    deps.configService.worktrees,
    deps.configService.config.matchingStrategy
  );
  const generatedPath = join(parentDir, generatedName);

  const previewCtx = {
    path: generatedPath,
    name: generatedName,
    branch: generatedBranch,
    project,
    mainWorktree,
  };

  const tokens: TemplateToken[] = [
    {
      token: '{{path}}',
      value: previewCtx.path,
      source: 'generated from parentDir + sample feature name',
    },
    {
      token: '{{name}}',
      value: previewCtx.name,
      source: 'generated sample feature name',
    },
    {
      token: '{{branch}}',
      value: previewCtx.branch,
      source: 'generated from sample feature name',
    },
    {
      token: '{{project}}',
      value: previewCtx.project,
      source: 'computed from current repository root name',
    },
    {
      token: '{{mainWorktree}}',
      value: previewCtx.mainWorktree,
      source: 'computed from git common dir',
    },
  ];

  const parentDirTemplate = deps.settings.parentDir ?? '../{{project}}.worktrees';
  const parentDirPreview = expandTemplate(parentDirTemplate, {
    ...previewCtx,
    path: '',
    name: '',
    branch: '',
  });

  if (ctx.hasUI) {
    await ctx.ui.custom<void>((_tui, theme, _kb, done) =>
      createTemplatePreviewComponent(
        {
          cwd: ctx.cwd,
          currentBranch,
          parentDirTemplate,
          parentDirPreview,
          sampleFeatureName: SAMPLE_FEATURE_NAME,
          tokens,
        },
        theme,
        () => done(undefined)
      )
    );
    return;
  }

  const lines = buildPlainLines(
    ctx.cwd,
    currentBranch,
    parentDirTemplate,
    parentDirPreview,
    tokens
  );
  ctx.ui.notify(lines.join('\n'), 'info');
}
