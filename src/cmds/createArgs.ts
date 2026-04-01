const SIMPLE_NAME_PATTERN = /^[A-Za-z0-9._-]+$/;

const BRANCH_FIRST_USAGE = '/worktree create <branch> [--name <worktree-name>]';
const GENERATE_USAGE = '/worktree create --generate [--name <worktree-name>] <prompt-or-name>';
const CREATE_USAGE = `Usage: ${BRANCH_FIRST_USAGE} OR ${GENERATE_USAGE}`;

interface CreateCommandArgsBase {
  worktreeName: string;
  explicitName: boolean;
}

export interface CreateCommandBranchArgs extends CreateCommandArgsBase {
  generate: false;
  branch: string;
  showLegacyWarning: boolean;
}

export interface CreateCommandGenerateArgs extends CreateCommandArgsBase {
  generate: true;
  generatorInput: string;
  showLegacyWarning: false;
}

export type CreateCommandArgs = CreateCommandBranchArgs | CreateCommandGenerateArgs;

export interface CreateCommandArgError {
  error: string;
}

export function slugifyBranch(branch: string): string {
  return branch
    .toLowerCase()
    .replace(/[\s/_.]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isValidWorktreeName(name: string): boolean {
  return SIMPLE_NAME_PATTERN.test(name);
}

function isLegacyStyleToken(token: string): boolean {
  if (!token) {
    return false;
  }

  if (token.includes('/')) {
    return false;
  }

  return SIMPLE_NAME_PATTERN.test(token);
}

export function parseCreateCommandArgs(args: string): CreateCommandArgs | CreateCommandArgError {
  const tokens = args.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return { error: CREATE_USAGE };
  }

  let explicitName: string | undefined;
  let useGenerator = false;
  const positional: string[] = [];

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];

    if (token === '--name') {
      if (explicitName) {
        return { error: 'Duplicate --name option. Provide it only once.' };
      }

      const value = tokens[index + 1];
      if (!value || value.startsWith('--')) {
        return {
          error: `Missing value for --name. ${CREATE_USAGE}`,
        };
      }

      explicitName = value;
      index += 1;
      continue;
    }

    if (token === '--generate') {
      if (useGenerator) {
        return { error: 'Duplicate --generate option. Provide it only once.' };
      }

      useGenerator = true;
      continue;
    }

    if (token.startsWith('--')) {
      return {
        error: `Unknown argument: ${token}. ${CREATE_USAGE}`,
      };
    }

    positional.push(token);
  }

  if (positional.length !== 1) {
    return {
      error: `Expected exactly one ${useGenerator ? '<prompt-or-name>' : '<branch>'}. ${CREATE_USAGE}`,
    };
  }

  if (explicitName && !isValidWorktreeName(explicitName)) {
    return {
      error:
        "Invalid worktree name for --name. Use only letters, numbers, '.', '_' or '-' (no '/').",
    };
  }

  const sourceToken = positional[0];
  const derivedName = slugifyBranch(sourceToken);
  if (!explicitName && !derivedName) {
    return {
      error:
        'Derived worktree name is empty after slugify. Use a source with letters/numbers or pass --name <worktree-name>.',
    };
  }

  if (useGenerator) {
    return {
      generate: true,
      generatorInput: sourceToken,
      worktreeName: explicitName ?? derivedName,
      explicitName: Boolean(explicitName),
      showLegacyWarning: false,
    };
  }

  return {
    generate: false,
    branch: sourceToken,
    worktreeName: explicitName ?? derivedName,
    explicitName: Boolean(explicitName),
    showLegacyWarning: !explicitName && isLegacyStyleToken(sourceToken),
  };
}
