import { beforeEach, describe, expect, it, vi } from 'vitest';
import { matchRepo } from '../../src/services/git.ts';
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

vi.mock('@zenobius/pi-extension-config', () => ({
  createConfigService: createConfigServiceMock,
}));

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
  store = createMockStore();
  createConfigServiceMock.mockReset();
  createConfigServiceMock.mockImplementation(
    async (_name: string, _options: CreateConfigServiceOptions = {}) => {
      return store;
    }
  );
});

describe('config service integration', () => {
  it('provides worktree settings that resolve exact match over wildcard', async () => {
    store = createMockStore({
      worktrees: {
        'github.com/org/*': { parentDir: '/tmp/wildcard.worktrees', onCreate: 'echo wildcard' },
        'github.com/org/repo': { parentDir: '/tmp/exact.worktrees', onCreate: 'echo exact' },
      },
      matchingStrategy: 'fail-on-tie',
    });

    createConfigServiceMock.mockImplementation(async () => store);

    const service = await createPiWorktreeConfigService();
    const result = matchRepo(
      'https://github.com/org/repo',
      service.worktrees,
      store.config.matchingStrategy
    );

    expect(result.type).toBe('exact');
    if (result.type === 'tie-conflict') {
      throw new Error('Expected non tie-conflict result');
    }

    expect(result.matchedPattern).toBe('github.com/org/repo');
    expect(result.settings.parentDir).toBe('/tmp/exact.worktrees');
  });

  it('provides worktree settings that fall back to default when no pattern matches', async () => {
    store = createMockStore({
      worktrees: {
        'github.com/other/*': { parentDir: '/tmp/other.worktrees', onCreate: 'echo other' },
      },
      matchingStrategy: 'fail-on-tie',
    });

    createConfigServiceMock.mockImplementation(async () => store);

    const service = await createPiWorktreeConfigService();
    const result = matchRepo(
      'https://github.com/org/repo',
      service.worktrees,
      store.config.matchingStrategy
    );

    expect(result.type).toBe('no-match');
    if (result.type === 'tie-conflict') {
      throw new Error('Expected non tie-conflict result');
    }

    expect(result.matchedPattern).toBeNull();
    expect(result.settings.onCreate).toBe('cd {cwd}');
  });

  it('keeps onCreate values compatible with command-list normalization in command layer', async () => {
    const toList = (value: string | string[] | undefined): string[] => {
      if (!value) {
        return [];
      }

      return Array.isArray(value) ? value : [value];
    };

    store = createMockStore({
      worktrees: {
        'github.com/org/repo': { onCreate: 'echo one' },
      },
    });

    createConfigServiceMock.mockImplementation(async () => store);

    const serviceA = await createPiWorktreeConfigService();
    const settingsA = serviceA.worktrees.get('github.com/org/repo');
    expect(toList(settingsA?.onCreate)).toEqual(['echo one']);

    store = createMockStore({
      worktrees: {
        'github.com/org/repo': { onCreate: ['echo one', 'echo two'] },
      },
    });

    createConfigServiceMock.mockImplementation(async () => store);

    const serviceB = await createPiWorktreeConfigService();
    const settingsB = serviceB.worktrees.get('github.com/org/repo');
    expect(toList(settingsB?.onCreate)).toEqual(['echo one', 'echo two']);
  });
});
