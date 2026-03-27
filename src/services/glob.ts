function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const doubleStarReplaced = escaped.replace(/\*\*/g, '::DOUBLE_STAR::');
  const singleStarReplaced = doubleStarReplaced.replace(/\*/g, '[^/]*');
  const regexBody = singleStarReplaced.replace(/::DOUBLE_STAR::/g, '.*');
  return new RegExp(regexBody, 'i');
}

export function globMatch(input: string, pattern: string): boolean {
  return globToRegExp(pattern).test(input);
}
