import type { RegisteredCommand } from '@earendil-works/pi-coding-agent';
import type { AutocompleteItem } from '@earendil-works/pi-tui';

type CommandMap = Record<string, unknown>;

function toItem(command: string): AutocompleteItem {
  return {
    value: command,
    label: command,
  };
}

export function createCompletionFactory(
  commands: CommandMap
): NonNullable<RegisteredCommand['getArgumentCompletions']> {
  const commandNames = Object.keys(commands).sort();

  return (argumentPrefix) => {
    const prefix = argumentPrefix.trimStart();

    if (prefix.includes(' ')) {
      return null;
    }

    if (!prefix) {
      return commandNames.map(toItem);
    }

    return commandNames.filter((command) => command.startsWith(prefix)).map(toItem);
  };
}
