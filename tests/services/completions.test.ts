import { describe, expect, it } from 'vitest';

import { createCompletionFactory } from '../../src/services/completions.ts';

describe('completion service', () => {
  const commands = {
    init: () => {},
    settings: () => {},
    create: () => {},
    list: () => {},
    remove: () => {},
  };

  it('returns top-level subcommand completions', () => {
    const complete = createCompletionFactory(commands);

    expect(complete('cr')?.map((item) => item.value)).toEqual(['create']);
    expect(complete('se')?.map((item) => item.value)).toEqual(['settings']);
  });

  it('returns null for nested argument prefixes', () => {
    const complete = createCompletionFactory(commands);

    expect(complete('create fea')).toBeNull();
  });

  it('returns all subcommands when prefix is empty', () => {
    const complete = createCompletionFactory(commands);

    expect(complete('')?.map((item) => item.value)).toEqual([
      'create',
      'init',
      'list',
      'remove',
      'settings',
    ]);
  });
});
