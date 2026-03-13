import type { MatchingStrategy, ResolvedConfig, WorktreeSettingsConfig } from './config.ts';
import { normalizeGitUrl } from './git.ts';

export interface MatchResult {
  settings: WorktreeSettingsConfig;
  matchedPattern: string | null;
  isExact: boolean;
}

export interface TieConflictError {
  type: 'tie-conflict';
  patterns: string[];
  url: string;
  message: string;
}

interface ScoredMatch {
  pattern: string;
  normalizedPattern: string;
  specificity: number;
}

function stripProtocol(value: string): string {
  return value.replace(/^https:\/\//, '');
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const doubleStarReplaced = escaped.replace(/\*\*/g, '::DOUBLE_STAR::');
  const singleStarReplaced = doubleStarReplaced.replace(/\*/g, '[^/]*');
  const regexBody = singleStarReplaced.replace(/::DOUBLE_STAR::/g, '.*');
  return new RegExp(`^${regexBody}$`, 'i');
}

function globMatch(input: string, pattern: string): boolean {
  return globToRegExp(pattern).test(input);
}

function calculateSpecificity(normalizedPattern: string): number {
  const segments = stripProtocol(normalizedPattern).split('/').filter(Boolean);
  let score = 0;

  for (const segment of segments) {
    if (segment === '**' || segment === '*') {
      continue;
    }

    if (segment.includes('*')) {
      score += 0.5;
      continue;
    }

    score += 1;
  }

  return score;
}

function resolveTie(
  tiedMatches: ScoredMatch[],
  url: string,
  strategy: MatchingStrategy,
  worktrees: Record<string, WorktreeSettingsConfig>
): MatchResult | TieConflictError {
  const patterns = tiedMatches.map((match) => match.pattern);

  if (strategy === 'fail-on-tie') {
    return {
      type: 'tie-conflict',
      patterns,
      url,
      message: `Multiple patterns match with equal specificity:\n${patterns
        .map((pattern) => `  - ${pattern}`)
        .join('\n')}\n\nRefine patterns or set matchingStrategy to 'first-wins' or 'last-wins'.`,
    };
  }

  if (strategy === 'last-wins') {
    const winner = patterns[patterns.length - 1];
    return {
      settings: worktrees[winner],
      matchedPattern: winner,
      isExact: false,
    };
  }

  const winner = patterns[0];
  return {
    settings: worktrees[winner],
    matchedPattern: winner,
    isExact: false,
  };
}

export function matchRepo(url: string, config: ResolvedConfig): MatchResult | TieConflictError {
  const normalizedUrl = normalizeGitUrl(url);
  const normalizedUrlWithoutProtocol = stripProtocol(normalizedUrl);

  const patterns = Object.keys(config.worktrees);
  if (patterns.length === 0) {
    return {
      settings: config.fallback,
      matchedPattern: null,
      isExact: false,
    };
  }

  const scoredMatches: ScoredMatch[] = [];

  for (const pattern of patterns) {
    const normalizedPattern = normalizeGitUrl(pattern);
    const normalizedPatternWithoutProtocol = stripProtocol(normalizedPattern);

    if (
      normalizedUrl === normalizedPattern ||
      normalizedUrlWithoutProtocol === normalizedPatternWithoutProtocol
    ) {
      return {
        settings: config.worktrees[pattern],
        matchedPattern: pattern,
        isExact: true,
      };
    }

    if (globMatch(normalizedUrlWithoutProtocol, normalizedPatternWithoutProtocol)) {
      scoredMatches.push({
        pattern,
        normalizedPattern,
        specificity: calculateSpecificity(normalizedPattern),
      });
    }
  }

  if (scoredMatches.length === 0) {
    return {
      settings: config.fallback,
      matchedPattern: null,
      isExact: false,
    };
  }

  scoredMatches.sort((left, right) => right.specificity - left.specificity);

  const topSpecificity = scoredMatches[0].specificity;
  const tiedMatches = scoredMatches.filter((match) => match.specificity === topSpecificity);

  if (tiedMatches.length > 1) {
    return resolveTie(tiedMatches, normalizedUrl, config.matchingStrategy, config.worktrees);
  }

  const winner = scoredMatches[0].pattern;
  return {
    settings: config.worktrees[winner],
    matchedPattern: winner,
    isExact: false,
  };
}

export function isTieConflict(result: MatchResult | TieConflictError): result is TieConflictError {
  return (result as TieConflictError).type === 'tie-conflict';
}
