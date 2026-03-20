import { beforeEach, describe, expect, it, vi } from 'vitest';

import { migration as legacyMigration } from '../../src/services/config/migrations/01-flat-single.ts';
import type { PiWorktreeConfig } from '../../src/services/config/schema.ts';
import { createPiWorktreeConfigService } from '../../src/services/config/config.ts';

type StoreTarget = 'home' | 'project';

type MockStore = {
  config: PiWorktreeConfig;
  ready: Promise<void>;
  set: ReturnType<typeof vi.fn>;
  reload: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  events: { on: ReturnType<typeof vi.fn> };
};

type CreateConfigServiceOptions = {
  defaults?: Partial<PiWorktreeConfig>;
  parse?: (config: unknown) => PiWorktreeConfig;
  migrations?: Array<{ id: string; up: (config: unknown) => Record<string, unknown> }>;
};

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
    set: vi.fn(async (key: string, value: unknown, _target: StoreTarget = 'home') => {
      (nextStore.config as Record<string, unknown>)[key] = value;
    }),
    reload: vi.fn(async () => {}),
    save: vi.fn(async (_target: StoreTarget = 'home') => {}),
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
  it('parses worktrees map with onCreate as string or string[]', async () => {
    await createPiWorktreeConfigService();

    const parse = capturedOptions?.parse;
    expect(parse).toBeDefined();

    const parsedString = parse?.({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: 'cd {cwd}',
        },
      },
    });

    const parsedArray = parse?.({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: ['cd {cwd}', 'git status'],
        },
      },
    });

    expect(parsedString).toEqual({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: 'cd {cwd}',
        },
      },
    });

    expect(parsedArray).toEqual({
      worktrees: {
        'github.com/org/repo': {
          parentDir: '/tmp/repo.worktrees',
          onCreate: ['cd {cwd}', 'git status'],
        },
      },
    });
  });

  it('keeps legacy singular shape parseable via migration path', async () => {
    await createPiWorktreeConfigService();

    const parse = capturedOptions?.parse;
    const migration = capturedOptions?.migrations?.[0];

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
      },
    };

    store = createMockStore({
      worktrees,
      matchingStrategy: 'fail-on-tie',
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
    });

    expect(store.set).toHaveBeenNthCalledWith(1, 'worktrees', worktrees, 'home');
    expect(store.set).toHaveBeenNthCalledWith(2, 'matchingStrategy', 'last-wins', 'home');
    expect(store.save).toHaveBeenCalledWith('home');

    expect(store.config.worktrees).toEqual(worktrees);
    expect(store.config.matchingStrategy).toBe('last-wins');
    expect(capturedOptions?.parse?.(store.config)).toEqual({
      worktrees,
      matchingStrategy: 'last-wins',
    });
  });
});
