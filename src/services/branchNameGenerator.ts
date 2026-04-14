import { spawn } from 'child_process';

export const BRANCH_NAME_GENERATOR_TIMEOUT_MS = 5000;

export type BranchNameGeneratorErrorCode =
  | 'missing-config'
  | 'timeout'
  | 'non-zero-exit'
  | 'empty-output'
  | 'invalid-output'
  | 'spawn-error';

export interface GenerateBranchNameParams {
  commandTemplate: string | undefined;
  input: string;
  cwd: string;
  timeoutMs?: number;
}

export interface GenerateBranchNameSuccess {
  ok: true;
  branchName: string;
  command: string;
}

export interface GenerateBranchNameFailure {
  ok: false;
  code: BranchNameGeneratorErrorCode;
  message: string;
}

export type GenerateBranchNameResult = GenerateBranchNameSuccess | GenerateBranchNameFailure;

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function renderCommand(template: string, input: string): string {
  const quotedInput = shellQuote(input);
  return template.replace(/\{\{prompt\}\}|\{prompt\}/g, quotedInput);
}

async function validateBranchName(branchName: string, cwd: string): Promise<boolean> {
  const checker = spawn('git', ['check-ref-format', '--branch', branchName], {
    cwd,
    shell: false,
    stdio: 'ignore',
  });

  return new Promise<boolean>((resolve) => {
    checker.on('close', (code) => resolve(code === 0));
    checker.on('error', () => resolve(false));
  });
}

export async function generateBranchName(
  params: GenerateBranchNameParams
): Promise<GenerateBranchNameResult> {
  const timeoutMs = params.timeoutMs ?? BRANCH_NAME_GENERATOR_TIMEOUT_MS;
  if (!params.commandTemplate?.trim()) {
    return {
      ok: false,
      code: 'missing-config',
      message:
        "No branchNameGenerator configured for this repository. Set worktrees.<pattern>.branchNameGenerator or run '/worktree create <branch>' without --generate.",
    };
  }

  const command = renderCommand(params.commandTemplate, params.input);

  const result = await new Promise<
    | { kind: 'success'; stdout: string; stderr: string; code: number }
    | { kind: 'spawn-error'; error: string }
    | { kind: 'timeout' }
  >((resolve) => {
    const child = spawn(command, {
      cwd: params.cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PI_WORKTREE_PROMPT: params.input,
      },
    });

    let stdout = '';
    let stderr = '';
    let done = false;

    const timer = globalThis.setTimeout(() => {
      if (done) {
        return;
      }

      done = true;
      child.kill('SIGKILL');
      resolve({ kind: 'timeout' });
    }, timeoutMs);

    child.stdout?.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr?.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (error) => {
      if (done) {
        return;
      }

      done = true;
      globalThis.clearTimeout(timer);
      resolve({ kind: 'spawn-error', error: error.message });
    });

    child.on('close', (code) => {
      if (done) {
        return;
      }

      done = true;
      globalThis.clearTimeout(timer);
      resolve({ kind: 'success', stdout, stderr, code: code ?? 1 });
    });
  });

  if (result.kind === 'timeout') {
    return {
      ok: false,
      code: 'timeout',
      message: `branchNameGenerator timed out after ${timeoutMs}ms. Make it faster or run '/worktree create <branch>' manually.`,
    };
  }

  if (result.kind === 'spawn-error') {
    return {
      ok: false,
      code: 'spawn-error',
      message: `Failed to run branchNameGenerator command: ${result.error}`,
    };
  }

  if (result.code !== 0) {
    const stderr = result.stderr.trim();
    return {
      ok: false,
      code: 'non-zero-exit',
      message: `branchNameGenerator exited with code ${result.code}.${stderr ? ` stderr: ${stderr}` : ''}`,
    };
  }

  const branchName = result.stdout.trim();
  if (!branchName) {
    return {
      ok: false,
      code: 'empty-output',
      message:
        'branchNameGenerator produced empty output. Ensure the command prints exactly one branch name to stdout.',
    };
  }

  const valid = await validateBranchName(branchName, params.cwd);
  if (!valid) {
    return {
      ok: false,
      code: 'invalid-output',
      message: `branchNameGenerator output is not a valid branch name: '${branchName}'. Fix the command output or run '/worktree create <branch>' manually.`,
    };
  }

  return {
    ok: true,
    branchName,
    command: params.commandTemplate,
  };
}
