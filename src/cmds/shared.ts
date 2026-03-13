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

export interface OnCreateResult {
  success: boolean;
  executed: string[];
  failed?: {
    command: string;
    code: number;
    error: string;
  };
}

function runCommand(command: string, cwd: string): Promise<CommandResult> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
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
  notify: (msg: string, type: 'info' | 'error' | 'warning') => void
): Promise<OnCreateResult> {
  if (!settings.onCreate) {
    return { success: true, executed: [] };
  }

  const commands = Array.isArray(settings.onCreate) ? settings.onCreate : [settings.onCreate];
  const executed: string[] = [];

  for (const template of commands) {
    const command = expandTemplate(template, createdCtx);
    notify(`Running: ${command}`, 'info');

    const result = await runCommand(command, createdCtx.path);
    executed.push(command);

    if (!result.success) {
      notify(`onCreate failed (exit ${result.code}): ${result.stderr.slice(0, 200)}`, 'error');
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

    if (result.stdout.trim()) {
      notify(result.stdout.trim().slice(0, 200), 'info');
    }
  }

  return { success: true, executed };
}
