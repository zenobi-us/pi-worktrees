import { describe, expect, it } from 'vitest';
import { runMigrations } from '@zenobius/pi-extension-config';

import { migration as migration01 } from '../../src/services/config/migrations/01-flat-single.ts';
import { migration as migration02 } from '../../src/services/config/migrations/02-worktree-to-worktrees.ts';
import { migration as migration03 } from '../../src/services/config/migrations/03-parentDir-to-worktreeRoot.ts';
import { migration as migration04 } from '../../src/services/config/migrations/04-oncreate-display-output-max-lines.ts';
import { migration as migration05 } from '../../src/services/config/migrations/05-oncreate-command-display-format.ts';
import { PiWorktreeConfigSchema } from '../../src/services/config/schema.ts';
import { Parse } from 'typebox/value';
import { matchRepo } from '../../src/services/git.ts';

describe('config migration set', () => {
  it('is versioned and executable as an ordered migration set', async () => {
    const migrations = [migration01, migration02, migration03, migration04, migration05];

    expect(migrations.map((migration) => migration.id)).toEqual([
      'legacy-flat-worktree-settings',
      'legacy-worktree-to-worktrees',
      'parentDir-to-worktreeRoot',
      'oncreate-display-output-max-lines-default',
      'oncreate-command-display-format-defaults',
    ]);

    const preview = await runMigrations({
      config: {},
      currentVersion: 0,
      migrations,
      dryRun: true,
    });

    expect(preview.status).toBe('preview');
    expect(preview.targetVersion).toBe(5);
    expect(preview.finalVersion).toBe(5);
    expect(preview.pendingCount).toBe(5);
  });

  it('migrates legacy worktree shape to worktrees fallback pattern', async () => {
    const migrations = [migration01, migration02, migration03, migration04, migration05];

    const result = await runMigrations({
      config: {
        worktree: {
          parentDir: '/tmp/legacy.worktrees',
          onCreate: 'cd {cwd}',
        },
        logfile: '/tmp/pi-worktree-{sessionId}-{name}-{timestamp}.log',
      } as unknown,
      currentVersion: 1,
      migrations,
      parse: (value: unknown) => Parse(PiWorktreeConfigSchema, value),
    });

    expect(result.status).toBe('migrated');
    expect(result.finalVersion).toBe(5);
    expect(result.config).toEqual({
      worktrees: {
        '**': {
          worktreeRoot: '/tmp/legacy.worktrees',
          onCreate: 'cd {cwd}',
        },
      },
      logfile: '/tmp/pi-worktree-{sessionId}-{name}-{timestamp}.log',
      onCreateDisplayOutputMaxLines: 5,
      onCreateCmdDisplayPending: '[ ] {{cmd}}',
      onCreateCmdDisplaySuccess: '[x] {{cmd}}',
      onCreateCmdDisplayError: '[ ] {{cmd}} [ERROR]',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });
  });

  it('uses migrated worktrees fallback pattern for no-match resolution', async () => {
    const migrations = [migration01, migration02, migration03, migration04, migration05];

    const migrationResult = await runMigrations({
      config: {
        worktree: {
          parentDir: '/tmp/legacy-fallback.worktrees',
          onCreate: 'echo legacy-fallback',
        },
      } as unknown,
      currentVersion: 1,
      migrations,
      parse: (value: unknown) => Parse(PiWorktreeConfigSchema, value),
    });

    const migrated = Parse(PiWorktreeConfigSchema, migrationResult.config);
    const repos = new Map(Object.entries(migrated.worktrees ?? {}));

    const result = matchRepo('https://github.com/unmatched/project', repos, 'fail-on-tie');

    expect(result.type).toBe('exact');
    if (result.type === 'tie-conflict') {
      throw new Error('Expected fallback exact match from migrated ** pattern');
    }

    expect(result.matchedPattern).toBe('**');
    expect(result.settings.worktreeRoot).toBe('/tmp/legacy-fallback.worktrees');
  });

  it('merges legacy worktree fallback into existing worktrees map', async () => {
    const migrations = [migration01, migration02, migration03, migration04, migration05];

    const result = await runMigrations({
      config: {
        worktrees: {
          'github.com/org/*': {
            worktreeRoot: '/tmp/org-shared.worktrees',
            onCreate: 'echo wildcard',
          },
        },
        worktree: {
          parentDir: '/tmp/legacy-fallback.worktrees',
          onCreate: 'echo legacy-fallback',
        },
      } as unknown,
      currentVersion: 1,
      migrations,
      parse: (value: unknown) => Parse(PiWorktreeConfigSchema, value),
    });

    expect(result.status).toBe('migrated');
    expect(result.config).toEqual({
      worktrees: {
        'github.com/org/*': {
          worktreeRoot: '/tmp/org-shared.worktrees',
          onCreate: 'echo wildcard',
        },
        '**': {
          worktreeRoot: '/tmp/legacy-fallback.worktrees',
          onCreate: 'echo legacy-fallback',
        },
      },
      onCreateDisplayOutputMaxLines: 5,
      onCreateCmdDisplayPending: '[ ] {{cmd}}',
      onCreateCmdDisplaySuccess: '[x] {{cmd}}',
      onCreateCmdDisplayError: '[ ] {{cmd}} [ERROR]',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });
  });

  it('keeps migration behavior policy-driven through framework validation', async () => {
    const migrations = [migration01, migration02, migration03, migration04, migration05];

    const result = await runMigrations({
      config: {
        parentDir: '/tmp/legacy.worktrees',
        onCreate: ['cd {cwd}', 'git status'],
      } as unknown,
      currentVersion: 0,
      migrations,
      parse: (value: unknown) => Parse(PiWorktreeConfigSchema, value),
    });

    expect(result.status).toBe('migrated');
    expect(result.failedCount).toBe(0);
    expect(result.warnings).toEqual([]);
    expect(result.config).toEqual({
      worktrees: {
        '**': {
          worktreeRoot: '/tmp/legacy.worktrees',
          onCreate: ['cd {cwd}', 'git status'],
        },
      },
      onCreateDisplayOutputMaxLines: 5,
      onCreateCmdDisplayPending: '[ ] {{cmd}}',
      onCreateCmdDisplaySuccess: '[x] {{cmd}}',
      onCreateCmdDisplayError: '[ ] {{cmd}} [ERROR]',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });
  });
});
