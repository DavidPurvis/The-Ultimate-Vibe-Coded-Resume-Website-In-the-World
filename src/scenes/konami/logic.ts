/** ↑ ↑ ↓ ↓ ← → ← → B A — rolling buffer of the last 10 keys. */
export const KONAMI = [
  'arrowup',
  'arrowup',
  'arrowdown',
  'arrowdown',
  'arrowleft',
  'arrowright',
  'arrowleft',
  'arrowright',
  'b',
  'a',
] as const;

export function pushKey(buffer: readonly string[], key: string): string[] {
  const next = [...buffer, key.toLowerCase()];
  return next.slice(-KONAMI.length);
}

export function matches(buffer: readonly string[]): boolean {
  return buffer.length === KONAMI.length && buffer.every((k, i) => k === KONAMI[i]);
}

/** Should this key event be ignored (typing in a form field)? */
export function isEditableTarget(
  t: { tagName?: string; isContentEditable?: boolean } | null,
): boolean {
  if (!t) return false;
  const tag = (t.tagName ?? '').toUpperCase();
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable === true;
}
