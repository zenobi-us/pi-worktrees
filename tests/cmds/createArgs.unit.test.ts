import { describe, expect, it } from 'vitest';

import { parseCreateCommandArgs, slugifyBranch } from '../../src/cmds/createArgs.ts';

describe('createArgs', () => {
  describe('slugifyBranch', () => {
    it('slugifies branch names deterministically', () => {
      expect(slugifyBranch('feature/login')).toBe('feature-login');
      expect(slugifyBranch('bugfix/JIRA-123/fix_npe')).toBe('bugfix-jira-123-fix-npe');
      expect(slugifyBranch('release/2026.04')).toBe('release-2026-04');
    });

    it('returns empty string when nothing remains after normalization', () => {
      expect(slugifyBranch('///___...')).toBe('');
    });
  });

  describe('parseCreateCommandArgs', () => {
    it('parses branch-first input and derives worktree name', () => {
      const result = parseCreateCommandArgs('feature/login');
      expect('error' in result).toBe(false);
      if ('error' in result) {
        return;
      }

      expect(result.generate).toBe(false);
      expect(result.branch).toBe('feature/login');
      expect(result.worktreeName).toBe('feature-login');
      expect(result.explicitName).toBe(false);
      expect(result.showLegacyWarning).toBe(false);
    });

    it('uses explicit --name override when provided', () => {
      const result = parseCreateCommandArgs('feature/login --name login-ui');
      expect('error' in result).toBe(false);
      if ('error' in result) {
        return;
      }

      expect(result.generate).toBe(false);
      expect(result.worktreeName).toBe('login-ui');
      expect(result.explicitName).toBe(true);
      expect(result.showLegacyWarning).toBe(false);
    });

    it('parses explicit --generate mode and keeps branch-first mode opt-in', () => {
      const generated = parseCreateCommandArgs('--generate auth-refactor');
      expect('error' in generated).toBe(false);
      if ('error' in generated) {
        return;
      }

      expect(generated.generate).toBe(true);
      expect(generated.generatorInput).toBe('auth-refactor');
      expect(generated.worktreeName).toBe('auth-refactor');

      const branchFirst = parseCreateCommandArgs('auth-refactor');
      expect('error' in branchFirst).toBe(false);
      if ('error' in branchFirst) {
        return;
      }

      expect(branchFirst.generate).toBe(false);
      expect(branchFirst.branch).toBe('auth-refactor');
    });

    it('rejects invalid explicit worktree names', () => {
      const result = parseCreateCommandArgs('feature/login --name bad/name');
      expect(result).toEqual({
        error:
          "Invalid worktree name for --name. Use only letters, numbers, '.', '_' or '-' (no '/').",
      });
    });

    it('emits legacy warning flag for single-token legacy-style input', () => {
      const result = parseCreateCommandArgs('login-flow');
      expect('error' in result).toBe(false);
      if ('error' in result) {
        return;
      }

      expect(result.generate).toBe(false);
      expect(result.showLegacyWarning).toBe(true);
      expect(result.branch).toBe('login-flow');
      expect(result.worktreeName).toBe('login-flow');
    });
  });
});
