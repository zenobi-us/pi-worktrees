import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PiWorktreeConfig } from '../../src/services/config/schema.ts';
import {
  createPiWorktreeConfigService,
  saveWorktreeSettings,
} from '../../src/services/config/config.ts';

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

function createMockStore(initialConfig: PiWorktreeConfig = {}): MockStore {
  const store: MockStore = {
    config: JSON.parse(JSON.stringify(initialConfig)),
    ready: Promise.resolve(),
    set: vi.fn(async (key: string, value: unknown) => {
      (store.config as Record<string, unknown>)[key] = value;
    }),
    reload: vi.fn(async () => {}),
    save: vi.fn(async () => {}),
    events: { on: vi.fn() },
  };

  return store;
}

let store: MockStore;

beforeEach(() => {
  store = createMockStore();
  createConfigServiceMock.mockReset();
  createConfigServiceMock.mockImplementation(async () => store);
});

describe('saveWorktreeSettings', () => {
  it('writes a new fallback pattern when none exists', async () => {
    const service = await createPiWorktreeConfigService();

    await saveWorktreeSettings(service, {
      fallback: { set: { worktreeRoot: '~/wt', onCreate: 'make setup' } },
    });

    expect(store.set).toHaveBeenCalledWith(
      'worktrees',
      { '**': { worktreeRoot: '~/wt', onCreate: 'make setup' } },
      'home'
    );
    expect(store.save).toHaveBeenCalledWith('home');
    expect(store.reload).toHaveBeenCalled();
  });

  it('merges into an existing fallback pattern', async () => {
    store = createMockStore({
      worktrees: {
        '**': { worktreeRoot: '~/existing', onCreate: 'echo keep-me' },
      },
    });
    createConfigServiceMock.mockImplementation(async () => store);

    const service = await createPiWorktreeConfigService();

    await saveWorktreeSettings(service, {
      fallback: { set: { onSwitch: 'echo switched' } },
    });

    const [, value] = store.set.mock.calls[0];
    expect(value).toEqual({
      '**': {
        worktreeRoot: '~/existing',
        onCreate: 'echo keep-me',
        onSwitch: 'echo switched',
      },
    });
  });

  it('clears specific keys without touching others', async () => {
    store = createMockStore({
      worktrees: {
        '**': {
          worktreeRoot: '~/wt',
          onCreate: 'echo go',
          onSwitch: 'echo switched',
          onBeforeRemove: 'echo remove',
        },
      },
    });
    createConfigServiceMock.mockImplementation(async () => store);

    const service = await createPiWorktreeConfigService();

    await saveWorktreeSettings(service, {
      fallback: { clear: ['onSwitch', 'onBeforeRemove'] },
    });

    const [, value] = store.set.mock.calls[0];
    expect(value).toEqual({
      '**': {
        worktreeRoot: '~/wt',
        onCreate: 'echo go',
      },
    });
  });

  it('applies clear before set so a key can be replaced atomically', async () => {
    store = createMockStore({
      worktrees: {
        '**': { onCreate: 'echo old' },
      },
    });
    createConfigServiceMock.mockImplementation(async () => store);

    const service = await createPiWorktreeConfigService();

    await saveWorktreeSettings(service, {
      fallback: { clear: ['onCreate'], set: { onCreate: 'echo new' } },
    });

    const [, value] = store.set.mock.calls[0];
    expect(value).toEqual({ '**': { onCreate: 'echo new' } });
  });

  it('preserves unrelated repo patterns while updating fallback', async () => {
    store = createMockStore({
      worktrees: {
        'github.com/org/*': { worktreeRoot: '~/org', onCreate: 'echo org' },
        '**': { worktreeRoot: '~/default' },
      },
    });
    createConfigServiceMock.mockImplementation(async () => store);

    const service = await createPiWorktreeConfigService();

    await saveWorktreeSettings(service, {
      fallback: { set: { onCreate: 'echo default' } },
    });

    const [, value] = store.set.mock.calls[0];
    expect(value).toEqual({
      'github.com/org/*': { worktreeRoot: '~/org', onCreate: 'echo org' },
      '**': { worktreeRoot: '~/default', onCreate: 'echo default' },
    });
  });

  it('writes per-pattern repo overrides', async () => {
    const service = await createPiWorktreeConfigService();

    await saveWorktreeSettings(service, {
      repo: {
        'github.com/org/repo': { set: { onCreate: 'bun install' } },
      },
    });

    const [, value] = store.set.mock.calls[0];
    expect(value).toEqual({
      'github.com/org/repo': { onCreate: 'bun install' },
    });
  });

  it('defaults scope to "home" and forwards explicit scope to set+save', async () => {
    const service = await createPiWorktreeConfigService();

    await saveWorktreeSettings(service, {
      fallback: { set: { onCreate: 'echo hi' } },
      scope: 'project',
    });

    expect(store.set).toHaveBeenCalledWith('worktrees', expect.any(Object), 'project');
    expect(store.save).toHaveBeenCalledWith('project');
  });
});

describe('PiWorktreeConfigService.getConfigPath', () => {
  it('returns the home config path by default', async () => {
    const service = await createPiWorktreeConfigService();
    const homePath = service.getConfigPath();
    expect(homePath).toMatch(/\.pi\/agent\/pi-worktrees\.config\.json$/);
  });

  it('returns the project config path when requested', async () => {
    const service = await createPiWorktreeConfigService();
    const projectPath = service.getConfigPath('project');
    expect(projectPath).toMatch(/\.pi\/pi-worktrees\.config\.json$/);
    expect(projectPath).not.toMatch(/\.pi\/agent\//);
  });
});
