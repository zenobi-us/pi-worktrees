import type { Theme } from '@mariozechner/pi-coding-agent';
import { Key, matchesKey, wrapTextWithAnsi } from '@mariozechner/pi-tui';

export interface TemplateToken {
  token: string;
  value: string;
  source: string;
}

type TemplatePreviewTheme = Pick<Theme, 'fg' | 'bold'>;

interface TemplatePreviewInput {
  cwd: string;
  currentBranch: string;
  parentDirTemplate: string;
  parentDirPreview: string;
  sampleFeatureName: string;
  tokens: TemplateToken[];
}

export function createTemplatePreviewComponent(
  input: TemplatePreviewInput,
  theme: TemplatePreviewTheme,
  done: () => void
): {
  render: (width: number) => string[];
  invalidate: () => void;
  handleInput: (data: string) => void;
} {
  const lines = [
    theme.fg('accent', theme.bold('Template Variables Preview')),
    theme.fg('dim', '━━━━━━━━━━━━━━━━━━━━━━━━━━'),
    '',
    `${theme.fg('accent', 'Current cwd:')} ${input.cwd}`,
    `${theme.fg('accent', 'Current branch:')} ${input.currentBranch}`,
    `${theme.fg('accent', 'Parent dir template:')} ${input.parentDirTemplate}`,
    `${theme.fg('accent', 'Parent dir resolved now:')} ${input.parentDirPreview}`,
    '',
    ...input.tokens.map(
      (item) =>
        `${theme.fg('warning', item.token.padEnd(16))} = ${item.value}\n  ${theme.fg('dim', 'source:')} ${item.source}`
    ),
    '',
    theme.fg('success', 'Notes:'),
    '  - {{name}}, {{branch}}, {{path}} are create-time values.',
    `  - This command uses generated data for them (${input.sampleFeatureName}).`,
    '',
    theme.fg('dim', 'Press enter, esc, or q to close.'),
  ];

  return {
    render(width: number): string[] {
      const wrapped: string[] = [];
      for (const line of lines) {
        if (!line) {
          wrapped.push('');
          continue;
        }

        wrapped.push(...wrapTextWithAnsi(line, width));
      }

      return wrapped;
    },
    invalidate(): void {},
    handleInput(data: string): void {
      if (
        matchesKey(data, Key.enter) ||
        matchesKey(data, Key.escape) ||
        data === 'q' ||
        data === 'Q'
      ) {
        done();
      }
    },
  };
}
