import { describe, expect, it } from 'vitest';
import { runMigrations } from '@zenobius/pi-extension-config';

import { migration as migration01 } from '../../src/services/config/migrations/01-flat-single.ts';
import { migration as migration02 } from '../../src/services/config/migrations/02-worktree-to-worktrees.ts';
import { PiWorktreeConfigSchema } from '../../src/services/config/schema.ts';
import { Parse } from 'typebox/value';

describe('config migration set', () => {
  it('is versioned and executable as an ordered migration set', async () => {
    const migrations = [migration01, migration02];

    expect(migrations.map((migration) => migration.id)).toEqual([
      'legacy-flat-worktree-settings',
      'legacy-worktree-to-worktrees',
    ]);

    const preview = await runMigrations({
      config: {},
      currentVersion: 0,
      migrations,
      dryRun: true,
    });

    expect(preview.status).toBe('preview');
    expect(preview.targetVersion).toBe(2);
    expect(preview.finalVersion).toBe(2);
    expect(preview.pendingCount).toBe(2);
  });

  it('migrates legacy worktree shape to worktrees fallback pattern', async () => {
    const migrations = [migration01, migration02];

    const result = await runMigrations({
      config: {
        worktree: {
          parentDir: '/tmp/legacy.worktrees',
          onCreate: 'cd {cwd}',
        },
      },
      currentVersion: 1,
      migrations,
      parse: (value: unknown) => Parse(PiWorktreeConfigSchema, value),
    });

    expect(result.status).toBe('migrated');
    expect(result.finalVersion).toBe(2);
    expect(result.config).toEqual({
      worktrees: {
        '**': {
          parentDir: '/tmp/legacy.worktrees',
          onCreate: 'cd {cwd}',
        },
      },
    });
  });

  it('keeps migration behavior policy-driven through framework validation', async () => {
    const migrations = [migration01, migration02];

    const result = await runMigrations({
      config: {
        parentDir: '/tmp/legacy.worktrees',
        onCreate: ['cd {cwd}', 'git status'],
      },
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
          parentDir: '/tmp/legacy.worktrees',
          onCreate: ['cd {cwd}', 'git status'],
        },
      },
    });
  });
});
