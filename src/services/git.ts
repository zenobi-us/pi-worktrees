import { execSync } from 'child_process';
import { appendFileSync, existsSync, readFileSync, statSync } from 'fs';
import { basename, dirname, join, relative, resolve } from 'path';
import { expandTemplate } from './templates.ts';
import {
  getConfiguredWorktreeRoot,
  MatchingStrategy,
  WorktreeSettingsConfig,
} from './config/schema.ts';
import { PiWorktreeConfiguredWorktreeMap } from './config/config.ts';
import { globMatch } from './glob.ts';

export interface WorktreeInfo {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isCurrent: boolean;
}

/**
 * Execute a git command and return stdout.
 */
export function git(args: string[], cwd?: string): string {
  try {
    return execSync(`git ${args.join(' ')}`, {
      cwd,
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim();
  } catch (error) {
    throw new Error(`git ${args[0]} failed: ${(error as Error).message}`);
  }
}

/**
 * Get git remote URL for repository.
 */
export function getRemoteUrl(cwd: string, remote = 'origin'): string | null {
  try {
    return git(['remote', 'get-url', remote], cwd);
  } catch {
    return null;
  }
}

/**
 * Check if we're in a git repository.
 */
export function isGitRepo(cwd: string): boolean {
  try {
    git(['rev-parse', '--git-dir'], cwd);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get the main worktree path (handles both regular repos and worktrees).
 */
export function getMainWorktreePath(cwd: string): string {
  const gitCommonDir = git(['rev-parse', '--path-format=absolute', '--git-common-dir'], cwd);
  return dirname(gitCommonDir);
}

/**
 * Get the project name from the main worktree path.
 */
export function getProjectName(cwd: string): string {
  return basename(getMainWorktreePath(cwd));
}

/**
 * Check if current directory is a worktree (not the main repo).
 */
export function isWorktree(cwd: string): boolean {
  try {
    const gitPath = join(cwd, '.git');
    if (existsSync(gitPath)) {
      const stat = statSync(gitPath);
      return stat.isFile();
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get current branch name.
 */
export function getCurrentBranch(cwd: string): string {
  try {
    return git(['branch', '--show-current'], cwd) || 'HEAD (detached)';
  } catch {
    return 'unknown';
  }
}

/**
 * List all worktrees.
 */
export function listWorktrees(cwd: string): WorktreeInfo[] {
  const output = git(['worktree', 'list', '--porcelain'], cwd);
  const worktrees: WorktreeInfo[] = [];
  const currentPath = resolve(cwd);
  const mainPath = getMainWorktreePath(cwd);

  let current: Partial<WorktreeInfo> = {};

  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      current.path = line.slice(9);
    } else if (line.startsWith('HEAD ')) {
      current.head = line.slice(5);
    } else if (line.startsWith('branch ')) {
      current.branch = line.slice(7).replace('refs/heads/', '');
    } else if (line === 'detached') {
      current.branch = 'HEAD (detached)';
    } else if (line === '') {
      if (current.path) {
        worktrees.push({
          path: current.path,
          branch: current.branch || 'unknown',
          head: current.head || 'unknown',
          isMain: current.path === mainPath,
          isCurrent: current.path === currentPath,
        });
      }
      current = {};
    }
  }

  if (current.path) {
    worktrees.push({
      path: current.path,
      branch: current.branch || 'unknown',
      head: current.head || 'unknown',
      isMain: current.path === mainPath,
      isCurrent: current.path === currentPath,
    });
  }

  return worktrees;
}

/**
 * Check if a target path is inside the repository root.
 */
export function isPathInsideRepo(repoPath: string, targetPath: string): boolean {
  const relPath = relative(repoPath, targetPath);
  return !relPath.startsWith('..') && !relPath.startsWith('/');
}

/**
 * Resolve the parent directory used for worktrees.
 *
 * Attempts to match to a configured repo, or defaults to using current git repos main worktree
 */
export function getWorktreeParentDir(
  cwd: string,
  repos: PiWorktreeConfiguredWorktreeMap,
  matchStrategy?: MatchingStrategy
): string {
  const project = getProjectName(cwd);
  const mainWorktree = getMainWorktreePath(cwd);
  const repo = getRemoteUrl(cwd);

  const repoReference = repo && repo.trim().length > 0 ? repo : '**';
  const worktree = matchRepo(repoReference, repos, matchStrategy);

  if (worktree.type === 'tie-conflict') {
    throw new Error(worktree.message);
  }

  const configuredRoot = getConfiguredWorktreeRoot(worktree.settings);
  if (configuredRoot) {
    return expandTemplate(configuredRoot, {
      path: '',
      name: '',
      branch: '',
      project,
      mainWorktree,
    });
  }

  return `${mainWorktree}.worktrees`;
}

/**
 * Ensure worktree dir is excluded from git tracking when it lives inside repo.
 */
export function ensureExcluded(cwd: string, worktreeParentDir: string): void {
  const mainWorktree = getMainWorktreePath(cwd);

  if (!isPathInsideRepo(mainWorktree, worktreeParentDir)) {
    return;
  }

  const excludePath = join(mainWorktree, '.git', 'info', 'exclude');
  const relPath = relative(mainWorktree, worktreeParentDir);
  const excludePattern = `/${relPath}/`;

  try {
    let content = '';
    if (existsSync(excludePath)) {
      content = readFileSync(excludePath, 'utf-8');
    }

    if (content.includes(excludePattern) || content.includes(relPath)) {
      return;
    }

    const newEntry = `\n# Worktree directory (added by worktree extension)\n${excludePattern}\n`;
    appendFileSync(excludePath, newEntry);
  } catch {
    // non-fatal
  }
}

class ConfiguredRepoKeyMismatchException extends Error {
  constructor(winner: string) {
    super();
    this.message = `ConfiguredRepoKeyMismatch: expected ${winner} to resolve to WorktreeSettingsConfig`;
  }
}

export interface MatchResult {
  settings: WorktreeSettingsConfig;
  matchedPattern: string | null;
}

export interface TieConflictError {
  patterns: string[];
  url: string;
  message: string;
}

export interface ScoredMatch {
  pattern: string;
  normalizedPattern: string;
  specificity: number;
}
export type Result =
  | ({
      type: 'exact';
    } & MatchResult)
  | ({ type: 'tie-conflict' } & TieConflictError)
  | ({ type: 'first-wins' } & MatchResult)
  | ({ type: 'last-wins' } & MatchResult);

function normalizeRepoReference(value: string): string {
  const trimmed = value.trim();

  const withoutProtocol = trimmed
    .replace(/^ssh:\/\//, '')
    .replace(/^https?:\/\//, '')
    .replace(/^git@([^:]+):/, '$1/');

  return withoutProtocol.replace(/\.git$/, '').replace(/\/+$/, '');
}

function calculateSpecificity(normalizedPattern: string): number {
  const segments = normalizedPattern.split('/').filter(Boolean);
  let score = 0;

  for (const segment of segments) {
    if (segment === '**' || segment === '*') {
      continue;
    }

    if (segment.includes('*')) {
      score += 0.5;
      continue;
    }

    score += 1;
  }

  return score;
}

function resolveTie(
  tiedMatches: ScoredMatch[],
  url: string,
  repos: PiWorktreeConfiguredWorktreeMap,
  matchingStrategy?: MatchingStrategy
): Result {
  const patterns = tiedMatches.map((match) => match.pattern);
  const strategy = matchingStrategy || 'fail-on-tie';

  if (strategy === 'fail-on-tie') {
    return {
      type: 'tie-conflict',
      patterns,
      url,
      message: `Multiple patterns match with equal specificity:\n${patterns
        .map((pattern) => `  - ${pattern}`)
        .join('\n')}\n\nRefine patterns or set matchingStrategy to 'first-wins' or 'last-wins'.`,
    };
  }

  const winner = strategy === 'last-wins' ? patterns[patterns.length - 1] : patterns[0];

  const settings = repos.get(winner);

  if (!settings) {
    throw new Error();
  }

  return {
    settings,
    matchedPattern: winner,
    type: strategy,
  };
}

export function matchRepo(
  url: string | null,
  repos: PiWorktreeConfiguredWorktreeMap,
  matchStrategy?: MatchingStrategy
): Result {
  const repoReference = url && url.trim().length > 0 ? url : '**';
  const normalizedUrl = normalizeRepoReference(repoReference);
  const scoredMatches: ScoredMatch[] = [];

  for (const [pattern, settings] of repos.entries()) {
    const normalizedPattern = normalizeRepoReference(pattern);

    if (normalizedUrl === normalizedPattern) {
      return {
        settings,
        matchedPattern: pattern,
        type: 'exact',
      };
    }

    if (globMatch(normalizedUrl, normalizedPattern)) {
      scoredMatches.push({
        pattern,
        normalizedPattern,
        specificity: calculateSpecificity(normalizedPattern),
      });
    }
  }

  if (scoredMatches.length === 0) {
    throw new Error(`No matching worktree settings for repo: ${normalizedUrl}`);
  }

  scoredMatches.sort((left, right) => right.specificity - left.specificity);

  const topSpecificity = scoredMatches[0].specificity;
  const tiedMatches = scoredMatches.filter((match) => match.specificity === topSpecificity);

  if (tiedMatches.length > 1) {
    return resolveTie(tiedMatches, normalizedUrl, repos, matchStrategy);
  }

  const winner = scoredMatches[0].pattern;
  const settings = repos.get(winner);
  if (!settings) {
    throw new ConfiguredRepoKeyMismatchException(winner);
  }

  return {
    settings,
    matchedPattern: winner,
    type: 'exact',
  };
}
