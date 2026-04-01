import { beforeEach, describe, expect, it, vi } from 'vitest';

import { migration as legacyMigration } from '../../src/services/config/migrations/01-flat-single.ts';
import type { PiWorktreeConfig } from '../../src/services/config/schema.ts';
import { createPiWorktreeConfigService } from '../../src/services/config/config.ts';

// eslint-disable-next-line no-unused-vars
type ParseConfigFn = (value: unknown) => PiWorktreeConfig;

type MockStore = {
  config: PiWorktreeConfig;
  ready: Promise<void>;
  set: ReturnType<typeof vi.fn>;
  reload: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  events: { on: ReturnType<typeof vi.fn> };
};

type CreateConfigServiceOptions = Record<string, unknown>;

const createConfigServiceMock = vi.fn();

vi.mock('@zenobius/pi-extension-config', () => {
  return {
    createConfigService: createConfigServiceMock,
  };
});

let capturedOptions: CreateConfigServiceOptions | undefined;
let store: MockStore;

function createMockStore(initialConfig: PiWorktreeConfig = {}): MockStore {
  const nextStore: MockStore = {
    config: { ...initialConfig },
    ready: Promise.resolve(),
    set: vi.fn(async (key: string, value: unknown) => {
      (nextStore.config as Record<string, unknown>)[key] = value;
    }),
    reload: vi.fn(async () => {}),
    save: vi.fn(async () => {}),
    events: { on: vi.fn() },
  };

  return nextStore;
}

beforeEach(() => {
  capturedOptions = undefined;
  store = createMockStore();

  createConfigServiceMock.mockReset();
  createConfigServiceMock.mockImplementation(
    async (_name: string, options: CreateConfigServiceOptions = {}) => {
      capturedOptions = options;
      return store;
    }
  );
});

describe('config loader integration', () => {
  it('parses worktree hooks as string or string[]', async () => {
    await createPiWorktreeConfigService();

    const parse = capturedOptions?.parse as ParseConfigFn | undefined;
    expect(parse).toBeDefined();

    const parsedString = parse?.({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: 'cd {cwd}',
          onSwitch: 'echo switched',
          onBeforeRemove: 'echo removing',
          branchNameGenerator: 'echo feature/from-generator',
        },
      },
      logfile: '/tmp/pi-worktree-{sessionId}-{name}.log',
      onCreateDisplayOutputMaxLines: 5,
      onCreateCmdDisplayPending: '[ ] {{cmd}}',
      onCreateCmdDisplaySuccess: '[x] {{cmd}}',
      onCreateCmdDisplayError: '[ ] {{cmd}} [ERROR]',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });

    const parsedArray = parse?.({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: ['cd {cwd}', 'git status'],
          onSwitch: ['echo switched', 'pwd'],
          onBeforeRemove: ['echo removing', 'git status --short'],
          branchNameGenerator: 'echo feature/from-generator',
        },
      },
      logfile: '/tmp/pi-worktree-{sessionId}-{name}-{timestamp}.log',
      onCreateDisplayOutputMaxLines: 7,
      onCreateCmdDisplayPending: '⏳ {{cmd}}',
      onCreateCmdDisplaySuccess: '✅ {{cmd}}',
      onCreateCmdDisplayError: '❌ {{cmd}}',
      onCreateCmdDisplayPendingColor: 'accent',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });

    expect(parsedString).toEqual({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: 'cd {cwd}',
          onSwitch: 'echo switched',
          onBeforeRemove: 'echo removing',
          branchNameGenerator: 'echo feature/from-generator',
        },
      },
      logfile: '/tmp/pi-worktree-{sessionId}-{name}.log',
      onCreateDisplayOutputMaxLines: 5,
      onCreateCmdDisplayPending: '[ ] {{cmd}}',
      onCreateCmdDisplaySuccess: '[x] {{cmd}}',
      onCreateCmdDisplayError: '[ ] {{cmd}} [ERROR]',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });

    expect(parsedArray).toEqual({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: ['cd {cwd}', 'git status'],
          onSwitch: ['echo switched', 'pwd'],
          onBeforeRemove: ['echo removing', 'git status --short'],
          branchNameGenerator: 'echo feature/from-generator',
        },
      },
      logfile: '/tmp/pi-worktree-{sessionId}-{name}-{timestamp}.log',
      onCreateDisplayOutputMaxLines: 7,
      onCreateCmdDisplayPending: '⏳ {{cmd}}',
      onCreateCmdDisplaySuccess: '✅ {{cmd}}',
      onCreateCmdDisplayError: '❌ {{cmd}}',
      onCreateCmdDisplayPendingColor: 'accent',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });
  });

  it('keeps legacy singular shape parseable via migration path', async () => {
    await createPiWorktreeConfigService();

    const parse = capturedOptions?.parse as ParseConfigFn | undefined;
    const migration = (capturedOptions?.migrations as Array<{ id: string }> | undefined)?.[0];

    expect(parse).toBeDefined();
    expect(migration?.id).toBe('legacy-flat-worktree-settings');

    const migrated = legacyMigration.up({
      parentDir: '/tmp/repo.worktrees',
      onCreate: ['cd {cwd}'],
    });

    expect(migrated).toEqual({
      worktree: {
        parentDir: '/tmp/repo.worktrees',
        onCreate: ['cd {cwd}'],
      },
    });

    expect(() => parse?.(migrated)).not.toThrow();
    expect(() => parse?.({ parentDir: '/tmp/repo.worktrees', onCreate: 'cd {cwd}' })).not.toThrow();
  });

  it('persists config with stable round-trip shape', async () => {
    const worktrees = {
      'github.com/org/repo': {
        parentDir: '/tmp/repo.worktrees',
        onCreate: ['cd {cwd}', 'git status'],
        branchNameGenerator: 'echo feature/from-generator',
      },
    };

    store = createMockStore({
      worktrees,
      matchingStrategy: 'fail-on-tie',
      logfile: '/tmp/custom-worktree-{sessionId}.log',
      onCreateDisplayOutputMaxLines: 8,
      onCreateCmdDisplayPending: 'pending {{cmd}}',
      onCreateCmdDisplaySuccess: 'done {{cmd}}',
      onCreateCmdDisplayError: 'boom {{cmd}}',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });

    createConfigServiceMock.mockReset();
    createConfigServiceMock.mockImplementation(
      async (_name: string, options: CreateConfigServiceOptions = {}) => {
        capturedOptions = options;
        return store;
      }
    );

    const service = await createPiWorktreeConfigService();

    expect(service.worktrees.get('github.com/org/repo')).toEqual(worktrees['github.com/org/repo']);

    await service.save({
      worktrees,
      matchingStrategy: 'last-wins',
      logfile: '/tmp/custom-worktree-{sessionId}.log',
      onCreateDisplayOutputMaxLines: 8,
      onCreateCmdDisplayPending: 'pending {{cmd}}',
      onCreateCmdDisplaySuccess: 'done {{cmd}}',
      onCreateCmdDisplayError: 'boom {{cmd}}',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });

    expect(store.set).toHaveBeenNthCalledWith(1, 'worktrees', worktrees, 'home');
    expect(store.set).toHaveBeenNthCalledWith(2, 'matchingStrategy', 'last-wins', 'home');
    expect(store.set).toHaveBeenNthCalledWith(
      3,
      'logfile',
      '/tmp/custom-worktree-{sessionId}.log',
      'home'
    );
    expect(store.set).toHaveBeenNthCalledWith(4, 'onCreateDisplayOutputMaxLines', 8, 'home');
    expect(store.set).toHaveBeenNthCalledWith(
      5,
      'onCreateCmdDisplayPending',
      'pending {{cmd}}',
      'home'
    );
    expect(store.set).toHaveBeenNthCalledWith(
      6,
      'onCreateCmdDisplaySuccess',
      'done {{cmd}}',
      'home'
    );
    expect(store.set).toHaveBeenNthCalledWith(7, 'onCreateCmdDisplayError', 'boom {{cmd}}', 'home');
    expect(store.set).toHaveBeenNthCalledWith(8, 'onCreateCmdDisplayPendingColor', 'dim', 'home');
    expect(store.set).toHaveBeenNthCalledWith(
      9,
      'onCreateCmdDisplaySuccessColor',
      'success',
      'home'
    );
    expect(store.set).toHaveBeenNthCalledWith(10, 'onCreateCmdDisplayErrorColor', 'error', 'home');
    expect(store.save).toHaveBeenCalledWith('home');

    expect(store.config.worktrees).toEqual(worktrees);
    expect(store.config.matchingStrategy).toBe('last-wins');
    expect(store.config.logfile).toBe('/tmp/custom-worktree-{sessionId}.log');
    expect(store.config.onCreateDisplayOutputMaxLines).toBe(8);
    expect(store.config.onCreateCmdDisplayPending).toBe('pending {{cmd}}');
    expect(store.config.onCreateCmdDisplaySuccess).toBe('done {{cmd}}');
    expect(store.config.onCreateCmdDisplayError).toBe('boom {{cmd}}');
    expect(store.config.onCreateCmdDisplayPendingColor).toBe('dim');
    expect(store.config.onCreateCmdDisplaySuccessColor).toBe('success');
    expect(store.config.onCreateCmdDisplayErrorColor).toBe('error');
    expect((capturedOptions?.parse as ParseConfigFn | undefined)?.(store.config)).toEqual({
      worktrees,
      matchingStrategy: 'last-wins',
      logfile: '/tmp/custom-worktree-{sessionId}.log',
      onCreateDisplayOutputMaxLines: 8,
      onCreateCmdDisplayPending: 'pending {{cmd}}',
      onCreateCmdDisplaySuccess: 'done {{cmd}}',
      onCreateCmdDisplayError: 'boom {{cmd}}',
      onCreateCmdDisplayPendingColor: 'dim',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });
  });
});
