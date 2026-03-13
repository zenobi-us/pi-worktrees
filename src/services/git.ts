import { execSync } from 'child_process';
import { appendFileSync, existsSync, readFileSync, statSync } from 'fs';
import { basename, dirname, join, relative, resolve } from 'path';
import type { WorktreeSettingsConfig } from './config/config.ts';
import { expandTemplate } from './templates.ts';

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
 * Normalize git remote URL into canonical https form for deterministic matching.
 */
export function normalizeGitUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }

  let normalized = trimmed.replace(/\.git$/i, '');

  const sshShortMatch = normalized.match(/^git@([^:]+):(.+)$/i);
  if (sshShortMatch) {
    const [, host, path] = sshShortMatch;
    normalized = `https://${host}/${path}`;
  }

  const sshLongMatch = normalized.match(/^ssh:\/\/git@([^/]+)\/(.+)$/i);
  if (sshLongMatch) {
    const [, host, path] = sshLongMatch;
    normalized = `https://${host}/${path}`;
  }

  normalized = normalized.replace(/^(https?:\/\/|git:\/\/)/i, 'https://');
  normalized = normalized.replace(/^https:\/\/[^@]+@/i, 'https://');

  normalized = normalized.replace(/\/+/g, '/');
  normalized = normalized.replace(/^https:\//, 'https://');

  return normalized.toLowerCase();
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
 */
export function getWorktreeParentDir(cwd: string, settings: WorktreeSettingsConfig): string {
  const project = getProjectName(cwd);
  const mainWorktree = getMainWorktreePath(cwd);

  if (settings.parentDir) {
    return expandTemplate(settings.parentDir, {
      path: '',
      name: '',
      branch: '',
      project,
      mainWorktree,
    });
  }

  return join(dirname(mainWorktree), `${project}.worktrees`);
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
