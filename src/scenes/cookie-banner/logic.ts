/** Fifty ASCII biscotti, written to localStorage only if you ask. */
export interface Biscotto {
  n: number;
  key: string;
  name: string;
  kind: string;
  art: string;
}

export function makeBiscotti(
  names: readonly string[],
  kinds: Record<string, string[]>,
): Biscotto[] {
  const kindNames = Object.keys(kinds);
  return names.slice(0, 50).map((name, i) => {
    const kind = kindNames[i % kindNames.length] as string;
    const n = i + 1;
    return {
      n,
      key: `uvcr:biscotti:${String(n).padStart(2, '0')}`,
      name,
      kind,
      art: (kinds[kind] ?? []).join('\n'),
    };
  });
}
