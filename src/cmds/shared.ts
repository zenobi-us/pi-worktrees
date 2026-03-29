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
  cmdDisplayPending?: string;
  cmdDisplaySuccess?: string;
  cmdDisplayError?: string;
  cmdDisplayPendingColor?: string;
  cmdDisplaySuccessColor?: string;
  cmdDisplayErrorColor?: string;
}

const ANSI = {
  reset: '\u001b[0m',
  gray: '\u001b[90m',
  blue: '\u001b[34m',
  green: '\u001b[32m',
  red: '\u001b[31m',
  yellow: '\u001b[33m',
};

interface CommandDisplayConfig {
  pendingTemplate: string;
  successTemplate: string;
  errorTemplate: string;
  pendingColor: string;
  successColor: string;
  errorColor: string;
}

function applyCommandTemplate(template: string, command: string): string {
  return template.replace(/\{\{cmd\}\}|\{cmd\}/g, command);
}

function resolveAnsiColor(colorName: string): string {
  if (colorName === 'dim') {
    return ANSI.gray;
  }

  if (colorName === 'accent' || colorName === 'info') {
    return ANSI.blue;
  }

  if (colorName === 'success') {
    return ANSI.green;
  }

  if (colorName === 'error') {
    return ANSI.red;
  }

  if (colorName === 'warning') {
    return ANSI.yellow;
  }

  return '';
}

function colorize(text: string, colorName: string): string {
  const ansi = resolveAnsiColor(colorName);
  if (!ansi) {
    return text;
  }

  return `${ansi}${text}${ANSI.reset}`;
}

function formatCommandLine(
  command: string,
  state: CommandState,
  config: CommandDisplayConfig
): string {
  if (state === 'success') {
    return colorize(applyCommandTemplate(config.successTemplate, command), config.successColor);
  }

  if (state === 'failed') {
    return colorize(applyCommandTemplate(config.errorTemplate, command), config.errorColor);
  }

  return colorize(applyCommandTemplate(config.pendingTemplate, command), config.pendingColor);
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
    // Negative values mean "no limit" – return all lines.
    return lines;
  }

  if (maxLines === 0) {
    // Explicitly requested no output.
    return [];
  }
  return lines.slice(-maxLines);
}

function formatCommandList(
  commands: string[],
  states: CommandState[],
  outputs: CommandOutput[],
  commandDisplay: CommandDisplayConfig,
  hookName: string,
  logPath?: string,
  displayOutputMaxLines = 5
): string {
  const lines: string[] = [`${hookName} steps:`];
  for (const [index, command] of commands.entries()) {
    const state = states[index];
    lines.push(formatCommandLine(command, state, commandDisplay));
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
 * Runs hook commands sequentially.
 * Stops at first failure and reports the failing command.
 */
export async function runHook(
  createdCtx: WorktreeCreatedContext,
  hookValue: WorktreeSettingsConfig['onCreate'] | undefined,
  hookName: 'onCreate' | 'onSwitch' | 'onBeforeRemove',
  // eslint-disable-next-line no-unused-vars
  notify: (msg: string, type: 'info' | 'error' | 'warning') => void,
  options?: OnCreateHookOptions
): Promise<OnCreateResult> {
  if (!hookValue) {
    return { success: true, executed: [] };
  }

  const commandTemplates = Array.isArray(hookValue) ? hookValue : [hookValue];
  const commands = commandTemplates.map((template) => expandTemplate(template, createdCtx));
  const executed: string[] = [];
  const commandStates: CommandState[] = commands.map(() => 'pending');
  const commandOutputs: CommandOutput[] = commands.map(() => ({ stdout: '', stderr: '' }));
  if (options?.logPath) {
    writeFileSync(
      options.logPath,
      [
        `# pi-worktree ${hookName} log`,
        `# worktree: ${createdCtx.path}`,
        `# branch: ${createdCtx.branch}`,
        '',
      ].join('\n')
    );
  }
  const displayOutputMaxLines = options?.displayOutputMaxLines ?? 5;
  const commandDisplay: CommandDisplayConfig = {
    pendingTemplate: options?.cmdDisplayPending ?? '[ ] {{cmd}}',
    successTemplate: options?.cmdDisplaySuccess ?? '[x] {{cmd}}',
    errorTemplate: options?.cmdDisplayError ?? '[ ] {{cmd}} [ERROR]',
    pendingColor: options?.cmdDisplayPendingColor ?? 'dim',
    successColor: options?.cmdDisplaySuccessColor ?? 'success',
    errorColor: options?.cmdDisplayErrorColor ?? 'error',
  };

  notify(
    formatCommandList(
      commands,
      commandStates,
      commandOutputs,
      commandDisplay,
      hookName,
      undefined,
      displayOutputMaxLines
    ),
    'info'
  );
  for (const [index, command] of commands.entries()) {
    commandStates[index] = 'running';
    notify(
      formatCommandList(
        commands,
        commandStates,
        commandOutputs,
        commandDisplay,
        hookName,
        undefined,
        displayOutputMaxLines
      ),
      'info'
    );
    const result = await runCommand(command, createdCtx.path, (stream, chunk) => {
      commandOutputs[index][stream] += chunk;
      notify(
        formatCommandList(
          commands,
          commandStates,
          commandOutputs,
          commandDisplay,
          hookName,
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
          commandDisplay,
          hookName,
          options?.logPath,
          displayOutputMaxLines
        ),
        'error'
      );
      notify(
        `${hookName} failed (exit ${result.code}): ${result.stderr.slice(0, 200)}${
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
      formatCommandList(
        commands,
        commandStates,
        commandOutputs,
        commandDisplay,
        hookName,
        undefined,
        displayOutputMaxLines
      ),
      'info'
    );
  }

  notify(
    formatCommandList(
      commands,
      commandStates,
      commandOutputs,
      commandDisplay,
      hookName,
      options?.logPath,
      displayOutputMaxLines
    ),
    'info'
  );
  return { success: true, executed };
}
export async function runOnCreateHook(
  createdCtx: WorktreeCreatedContext,
  settings: WorktreeSettingsConfig,
  // eslint-disable-next-line no-unused-vars
  notify: (msg: string, type: 'info' | 'error' | 'warning') => void,
  options?: OnCreateHookOptions
): Promise<OnCreateResult> {
  return runHook(createdCtx, settings.onCreate, 'onCreate', notify, options);
}
