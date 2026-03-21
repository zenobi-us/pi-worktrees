import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as gitService from '../../src/services/git.ts';
import type { PiWorktreeConfig } from '../../src/services/config/schema.ts';

import { createPiWorktreeConfigService } from '../../src/services/config/config.ts';

type MockStore = {
  config: PiWorktreeConfig;
  ready: Promise<void>;
  set: ReturnType<typeof vi.fn>;
  reload: ReturnType<typeof vi.fn>;
  save: ReturnType<typeof vi.fn>;
  events: { on: ReturnType<typeof vi.fn> };
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
  store = createMockStore();
  createConfigServiceMock.mockReset();
  createConfigServiceMock.mockImplementation(async () => {
    return store;
  });
  vi.spyOn(gitService, 'getRemoteUrl').mockReturnValue('https://github.com/org/repo');
  vi.spyOn(gitService, 'getProjectName').mockReturnValue('repo');
  vi.spyOn(gitService, 'getMainWorktreePath').mockReturnValue('/tmp/repo');
  vi.spyOn(gitService, 'getWorktreeParentDir').mockReturnValue('/tmp/repo.worktrees');
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
    const result = gitService.matchRepo(
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

  it('injects normalized fallback settings and resolves unmatched repo to "**"', async () => {
    store = createMockStore({
      worktrees: {
        'github.com/other/*': { parentDir: '/tmp/other.worktrees', onCreate: 'echo other' },
      },
      matchingStrategy: 'fail-on-tie',
    });

    createConfigServiceMock.mockImplementation(async () => store);
    const service = await createPiWorktreeConfigService();
    const fallback = service.worktrees.get('**');
    expect(fallback).toEqual({
      worktreeRoot: '{{mainWorktree}}.worktrees',
      onCreate: 'echo "Created {{path}}"',
    });
    const result = gitService.matchRepo(
      'https://github.com/org/repo',
      service.worktrees,
      store.config.matchingStrategy
    );

    expect(result.type).toBe('exact');
    if (result.type === 'tie-conflict') {
      throw new Error('Expected non tie-conflict result');
    }

    expect(result.matchedPattern).toBe('**');
    expect(result.settings.onCreate).toBe('echo "Created {{path}}"');
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

  it('exposes onCreate output display line limit with default fallback', async () => {
    store = createMockStore({
      worktrees: {
        '**': { onCreate: 'echo setup' },
      },
    });

    createConfigServiceMock.mockImplementation(async () => store);

    const serviceWithDefault = await createPiWorktreeConfigService();
    const defaultCurrent = serviceWithDefault.current({ cwd: '/tmp/repo' });
    expect(defaultCurrent.onCreateDisplayOutputMaxLines).toBe(5);

    store = createMockStore({
      worktrees: {
        '**': { onCreate: 'echo setup' },
      },
      onCreateDisplayOutputMaxLines: 12,
      onCreateCmdDisplayPending: '⏳ {{cmd}}',
      onCreateCmdDisplaySuccess: '✅ {{cmd}}',
      onCreateCmdDisplayError: '❌ {{cmd}}',
      onCreateCmdDisplayPendingColor: 'accent',
      onCreateCmdDisplaySuccessColor: 'success',
      onCreateCmdDisplayErrorColor: 'error',
    });

    createConfigServiceMock.mockImplementation(async () => store);

    const serviceWithCustom = await createPiWorktreeConfigService();
    const customCurrent = serviceWithCustom.current({ cwd: '/tmp/repo' });
    expect(customCurrent.onCreateDisplayOutputMaxLines).toBe(12);
    expect(customCurrent.onCreateCmdDisplayPending).toBe('⏳ {{cmd}}');
    expect(customCurrent.onCreateCmdDisplaySuccess).toBe('✅ {{cmd}}');
    expect(customCurrent.onCreateCmdDisplayError).toBe('❌ {{cmd}}');
    expect(customCurrent.onCreateCmdDisplayPendingColor).toBe('accent');
    expect(customCurrent.onCreateCmdDisplaySuccessColor).toBe('success');
    expect(customCurrent.onCreateCmdDisplayErrorColor).toBe('error');
    expect(defaultCurrent.onCreateCmdDisplayPending).toBe('[ ] {{cmd}}');
    expect(defaultCurrent.onCreateCmdDisplaySuccess).toBe('[x] {{cmd}}');
    expect(defaultCurrent.onCreateCmdDisplayError).toBe('[ ] {{cmd}} [ERROR]');
    expect(defaultCurrent.onCreateCmdDisplayPendingColor).toBe('dim');
    expect(defaultCurrent.onCreateCmdDisplaySuccessColor).toBe('success');
    expect(defaultCurrent.onCreateCmdDisplayErrorColor).toBe('error');
  });
});
