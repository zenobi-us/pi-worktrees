import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmdSettings } from '../../src/cmds/cmdSettings.ts';
import type { CommandDeps } from '../../src/types.ts';

type FakeStore = {
  worktrees: Record<string, Record<string, unknown>>;
  persistCalls: number;
};

function createFakeDeps(initial: FakeStore['worktrees'] = {}): {
  deps: CommandDeps;
  store: FakeStore;
} {
  const store: FakeStore = {
    worktrees: JSON.parse(JSON.stringify(initial)),
    persistCalls: 0,
  };

  const deps = {
    settings: initial['**'] ?? {},
    configService: {
      get config() {
        return { worktrees: store.worktrees };
      },
      set: vi.fn(async (key: string, value: unknown) => {
        if (key === 'worktrees') {
          store.worktrees = value as FakeStore['worktrees'];
        }
      }),
      persist: vi.fn(async () => {
        store.persistCalls += 1;
      }),
      reload: vi.fn(async () => {}),
      getConfigPath: vi.fn(() => '/fake/home/.pi/agent/pi-worktrees.config.json'),
    } as unknown as CommandDeps['configService'],
    statusService: {} as CommandDeps['statusService'],
  } as CommandDeps;

  return { deps, store };
}

function createCtx() {
  const notify = vi.fn();
  const ctx = {
    cwd: '/repo',
    hasUI: true,
    ui: { notify },
  };
  return { ctx, notify };
}

describe('cmdSettings persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('accepts onSwitch as a valid setting key and persists it', async () => {
    const { deps, store } = createFakeDeps();
    const { ctx, notify } = createCtx();

    await cmdSettings('onSwitch "echo switched"', ctx as never, deps);

    expect(store.worktrees).toEqual({
      '**': { onSwitch: 'echo switched' },
    });
    expect(store.persistCalls).toBe(1);
    const messages = notify.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m === '✓ Set onSwitch = "echo switched"')).toBe(true);
    expect(messages.some((m) => m.includes('Invalid setting key'))).toBe(false);
  });

  it('accepts onBeforeRemove and branchNameGenerator as valid keys', async () => {
    const { deps } = createFakeDeps();
    const { ctx, notify } = createCtx();

    await cmdSettings('onBeforeRemove "bun test"', ctx as never, deps);
    await cmdSettings('branchNameGenerator "pi gen"', ctx as never, deps);

    const messages = notify.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m.includes('Invalid setting key'))).toBe(false);
    expect(messages).toContain('✓ Set onBeforeRemove = "bun test"');
    expect(messages).toContain('✓ Set branchNameGenerator = "pi gen"');
  });

  it('clears onSwitch when value is "clear"', async () => {
    const { deps, store } = createFakeDeps({
      '**': { onCreate: 'keep me', onSwitch: 'to remove' },
    });
    const { ctx, notify } = createCtx();

    await cmdSettings('onSwitch clear', ctx as never, deps);

    expect(store.worktrees).toEqual({
      '**': { onCreate: 'keep me' },
    });
    const messages = notify.mock.calls.map((call) => String(call[0]));
    expect(messages).toContain('✓ Cleared onSwitch');
  });

  it('does not emit success notice when persist fails', async () => {
    const { deps } = createFakeDeps();
    (deps.configService.persist as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error('disk full')
    );
    const { ctx, notify } = createCtx();

    await cmdSettings('onCreate "echo hi"', ctx as never, deps);

    const messages = notify.mock.calls.map((call) => ({
      msg: String(call[0]),
      level: call[1],
    }));
    expect(messages.some((m) => m.msg.startsWith('✓ Set'))).toBe(false);
    expect(messages.some((m) => m.msg.includes('Failed to save settings'))).toBe(true);
    expect(messages.some((m) => m.msg.includes('disk full'))).toBe(true);
  });

  it('rejects unknown keys without calling set/persist', async () => {
    const { deps } = createFakeDeps();
    const { ctx, notify } = createCtx();

    await cmdSettings('bogusKey value', ctx as never, deps);

    expect(deps.configService.set).not.toHaveBeenCalled();
    expect(deps.configService.persist).not.toHaveBeenCalled();
    const messages = notify.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m.includes('Invalid setting key: "bogusKey"'))).toBe(true);
  });

  it('lists every configured field including onSwitch/onBeforeRemove when called with no args', async () => {
    const { deps } = createFakeDeps({
      '**': {
        worktreeRoot: '~/wt',
        onCreate: 'echo go',
        onSwitch: 'echo switched',
        onBeforeRemove: 'bun test',
        branchNameGenerator: 'pi gen',
      },
    });
    const { ctx, notify } = createCtx();

    await cmdSettings('', ctx as never, deps);

    const fullText = notify.mock.calls.map((call) => String(call[0])).join('\n');
    expect(fullText).toContain('worktreeRoot:');
    expect(fullText).toContain('onCreate:');
    expect(fullText).toContain('onSwitch:');
    expect(fullText).toContain('onBeforeRemove:');
    expect(fullText).toContain('branchNameGenerator:');
    expect(fullText).toContain('Config file: /fake/home/.pi/agent/pi-worktrees.config.json');
  });

  it('treats parentDir as a deprecated alias and migrates to worktreeRoot', async () => {
    const { deps, store } = createFakeDeps();
    const { ctx, notify } = createCtx();

    await cmdSettings('parentDir "~/legacy"', ctx as never, deps);

    expect(store.worktrees).toEqual({
      '**': { worktreeRoot: '~/legacy' },
    });
    const messages = notify.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m.includes('deprecated'))).toBe(true);
    expect(messages).toContain('✓ Set worktreeRoot = "~/legacy"');
  });
});
