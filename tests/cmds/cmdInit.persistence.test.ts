import { beforeEach, describe, expect, it, vi } from 'vitest';

import { cmdInit } from '../../src/cmds/cmdInit.ts';
import type { CommandDeps } from '../../src/types.ts';

type FakeStore = {
  worktrees: Record<string, Record<string, unknown>>;
  persistCalls: number;
  reloadCalls: number;
};

function createFakeDeps(initial: FakeStore['worktrees'] = {}): {
  deps: CommandDeps;
  store: FakeStore;
} {
  const store: FakeStore = {
    worktrees: JSON.parse(JSON.stringify(initial)),
    persistCalls: 0,
    reloadCalls: 0,
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
      reload: vi.fn(async () => {
        store.reloadCalls += 1;
      }),
      getConfigPath: vi.fn(() => '/fake/home/.pi/agent/pi-worktrees.config.json'),
    } as unknown as CommandDeps['configService'],
    statusService: {} as CommandDeps['statusService'],
  } as CommandDeps;

  return { deps, store };
}

function createFakeCtx(scripted: {
  select?: unknown;
  inputs?: (string | undefined)[];
  confirm?: boolean;
}) {
  const notify = vi.fn();
  const inputs = [...(scripted.inputs ?? [])];
  const ctx = {
    cwd: '/repo',
    hasUI: true,
    ui: {
      notify,
      select: vi.fn(async () => scripted.select),
      input: vi.fn(async () => inputs.shift()),
      confirm: vi.fn(async () => scripted.confirm ?? true),
    },
  };

  return { ctx, notify };
}

describe('cmdInit persistence', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('persists all four hooks to the "**" fallback', async () => {
    const { deps, store } = createFakeDeps();
    const { ctx, notify } = createFakeCtx({
      select: 'Default ({{mainWorktree}}.worktrees)',
      inputs: ['make setup', 'echo switched', 'bun test'],
      confirm: true,
    });

    await cmdInit('', ctx as never, deps);

    expect(deps.configService.set).toHaveBeenCalledWith(
      'worktrees',
      {
        '**': {
          onCreate: 'make setup',
          onSwitch: 'echo switched',
          onBeforeRemove: 'bun test',
        },
      },
      'home'
    );
    expect(store.persistCalls).toBe(1);
    expect(store.reloadCalls).toBe(1);

    const successNotices = notify.mock.calls
      .map((call) => ({ msg: String(call[0]), level: call[1] }))
      .filter((entry) => entry.msg.startsWith('✓'));
    expect(successNotices).toHaveLength(1);
    expect(successNotices[0].msg).toContain('Settings saved');
  });

  it('emits the success notice only after save resolves', async () => {
    const { deps } = createFakeDeps();
    const saveError = new Error('disk full');
    (deps.configService.persist as ReturnType<typeof vi.fn>).mockRejectedValueOnce(saveError);

    const { ctx, notify } = createFakeCtx({
      select: 'Default ({{mainWorktree}}.worktrees)',
      inputs: ['make setup', '', ''],
      confirm: true,
    });

    await cmdInit('', ctx as never, deps);

    const messages = notify.mock.calls.map((call) => String(call[0]));
    expect(messages.some((m) => m.startsWith('✓ Settings saved'))).toBe(false);
    expect(messages.some((m) => m.includes('Failed to save settings'))).toBe(true);
    expect(messages.some((m) => m.includes('disk full'))).toBe(true);
  });

  it('does not call set or persist when the user cancels the confirmation', async () => {
    const { deps } = createFakeDeps();
    const { ctx } = createFakeCtx({
      select: 'Default ({{mainWorktree}}.worktrees)',
      inputs: ['make setup', '', ''],
      confirm: false,
    });

    await cmdInit('', ctx as never, deps);

    expect(deps.configService.set).not.toHaveBeenCalled();
    expect(deps.configService.persist).not.toHaveBeenCalled();
  });

  it('clears previously-set hooks when the user empties the prompt', async () => {
    const { deps } = createFakeDeps({
      '**': {
        onCreate: 'old setup',
        onSwitch: 'old switch',
        onBeforeRemove: 'old remove',
      },
    });
    const { ctx } = createFakeCtx({
      select: 'Default ({{mainWorktree}}.worktrees)',
      inputs: ['new setup', '', ''],
      confirm: true,
    });

    await cmdInit('', ctx as never, deps);

    expect(deps.configService.set).toHaveBeenCalledWith(
      'worktrees',
      {
        '**': {
          onCreate: 'new setup',
        },
      },
      'home'
    );
  });
});
