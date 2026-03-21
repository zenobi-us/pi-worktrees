import { appendFileSync, writeFileSync } from 'fs';
import { spawn } from 'child_process';
import { expandTemplate } from '../services/templates.ts';
import type { WorktreeCreatedContext } from '../types.ts';
import { WorktreeSettingsConfig } from '../services/config/schema.ts';

interface CommandResult {
  success: boolean;
  code: number;
  stdout: string;
  stderr: string;
}

interface CommandOutput {
  stdout: string;
  stderr: string;
}

export interface OnCreateResult {
  success: boolean;
  executed: string[];
  failed?: {
    command: string;
    code: number;
    error: string;
  };
}

type CommandState = 'pending' | 'running' | 'success' | 'failed';

export interface OnCreateHookOptions {
  logPath?: string;
  displayOutputMaxLines?: number;
}

const ANSI = {
  reset: '\u001b[0m',
  gray: '\u001b[90m',
  blue: '\u001b[34m',
  green: '\u001b[32m',
  red: '\u001b[31m',
};

function formatCommandLine(index: number, command: string, state: CommandState): string {
  const number = String(index + 1).padStart(2, '0');

  if (state === 'pending') {
    return `${ANSI.gray}○ [${number}] ${command}${ANSI.reset}`;
  }

  if (state === 'running') {
    return `${ANSI.blue}🚧 [${number}] ${command}${ANSI.reset}`;
  }

  if (state === 'success') {
    return `${ANSI.green}✅ [${number}] ${command}${ANSI.reset}`;
  }

  return `${ANSI.red}❌ [${number}] ${command}${ANSI.reset}`;
}

function toLines(text: string): string[] {
  return text
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);
}

function formatOutputLine(stream: 'stdout' | 'stderr', line: string, state: CommandState): string {
  const prefix = stream === 'stderr' ? '⚠' : '›';

  if (state === 'running') {
    return `   ${prefix} ${line}`;
  }

  return `${ANSI.gray}   ${prefix} ${line}${ANSI.reset}`;
}

function getDisplayLines(text: string, maxLines: number): string[] {
  const lines = toLines(text);
  if (maxLines < 0) {
    return lines;
  }

  return lines.slice(-maxLines);
}

function formatCommandList(
  commands: string[],
  states: CommandState[],
  outputs: CommandOutput[],
  logPath?: string,
  displayOutputMaxLines = 5
): string {
  const lines: string[] = ['onCreate steps:'];

  for (const [index, command] of commands.entries()) {
    const state = states[index];
    lines.push(formatCommandLine(index, command, state));

    for (const line of getDisplayLines(outputs[index].stdout, displayOutputMaxLines)) {
      lines.push(formatOutputLine('stdout', line, state));
    }

    for (const line of getDisplayLines(outputs[index].stderr, displayOutputMaxLines)) {
      lines.push(formatOutputLine('stderr', line, state));
    }
  }

  if (logPath) {
    lines.push('');
    lines.push(`${ANSI.gray}log: ${logPath}${ANSI.reset}`);
  }

  return lines.join('\n');
}

function appendCommandLog(logPath: string, command: string, result: CommandResult): void {
  const lines: string[] = [`$ ${command}`];

  if (result.stdout) {
    lines.push('[stdout]');
    lines.push(result.stdout.trimEnd());
  }

  if (result.stderr) {
    lines.push('[stderr]');
    lines.push(result.stderr.trimEnd());
  }

  lines.push(`[exit ${result.code}]`);
  lines.push('');

  appendFileSync(logPath, `${lines.join('\n')}\n`);
}

function runCommand(
  command: string,
  cwd: string,
  // eslint-disable-next-line no-unused-vars
  onOutput?: (stream: 'stdout' | 'stderr', chunk: string) => void
): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const chunk = data.toString();
      stdout += chunk;
      onOutput?.('stdout', chunk);
    });

    child.stderr?.on('data', (data) => {
      const chunk = data.toString();
      stderr += chunk;
      onOutput?.('stderr', chunk);
    });

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        code: code ?? 1,
        stdout,
        stderr,
      });
    });

    child.on('error', (error) => {
      resolve({
        success: false,
        code: 1,
        stdout: '',
        stderr: error.message,
      });
    });
  });
}

/**
 * Runs post-create hooks sequentially.
 * Stops at first failure and reports the failing command.
 */
export async function runOnCreateHook(
  createdCtx: WorktreeCreatedContext,
  settings: WorktreeSettingsConfig,
  // eslint-disable-next-line no-unused-vars
  notify: (msg: string, type: 'info' | 'error' | 'warning') => void,
  options?: OnCreateHookOptions
): Promise<OnCreateResult> {
  if (!settings.onCreate) {
    return { success: true, executed: [] };
  }

  const commandTemplates = Array.isArray(settings.onCreate)
    ? settings.onCreate
    : [settings.onCreate];
  const commands = commandTemplates.map((template) => expandTemplate(template, createdCtx));
  const executed: string[] = [];

  const commandStates: CommandState[] = commands.map(() => 'pending');
  const commandOutputs: CommandOutput[] = commands.map(() => ({ stdout: '', stderr: '' }));

  if (options?.logPath) {
    writeFileSync(
      options.logPath,
      [
        `# pi-worktree onCreate log`,
        `# worktree: ${createdCtx.path}`,
        `# branch: ${createdCtx.branch}`,
        '',
      ].join('\n')
    );
  }

  const displayOutputMaxLines = options?.displayOutputMaxLines ?? 5;

  notify(
    formatCommandList(commands, commandStates, commandOutputs, undefined, displayOutputMaxLines),
    'info'
  );

  for (const [index, command] of commands.entries()) {
    commandStates[index] = 'running';
    notify(
      formatCommandList(commands, commandStates, commandOutputs, undefined, displayOutputMaxLines),
      'info'
    );

    const result = await runCommand(command, createdCtx.path, (stream, chunk) => {
      commandOutputs[index][stream] += chunk;
      notify(
        formatCommandList(
          commands,
          commandStates,
          commandOutputs,
          undefined,
          displayOutputMaxLines
        ),
        'info'
      );
    });

    if (options?.logPath) {
      appendCommandLog(options.logPath, command, result);
    }

    executed.push(command);

    if (!result.success) {
      commandStates[index] = 'failed';
      notify(
        formatCommandList(
          commands,
          commandStates,
          commandOutputs,
          options?.logPath,
          displayOutputMaxLines
        ),
        'error'
      );
      notify(
        `onCreate failed (exit ${result.code}): ${result.stderr.slice(0, 200)}${
          options?.logPath ? `\nlog: ${options.logPath}` : ''
        }`,
        'error'
      );
      return {
        success: false,
        executed,
        failed: {
          command,
          code: result.code,
          error: result.stderr,
        },
      };
    }

    commandStates[index] = 'success';
    notify(
      formatCommandList(commands, commandStates, commandOutputs, undefined, displayOutputMaxLines),
      'info'
    );
  }

  notify(
    formatCommandList(
      commands,
      commandStates,
      commandOutputs,
      options?.logPath,
      displayOutputMaxLines
    ),
    'info'
  );

  return { success: true, executed };
}
