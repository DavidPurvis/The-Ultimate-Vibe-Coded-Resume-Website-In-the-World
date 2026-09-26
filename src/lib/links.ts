/** Link behaviour: which "playful" links get rickrolled, and what counts as a plain click. */

export interface LinkLike {
  hasAttribute(name: string): boolean;
  getAttribute(name: string): string | null;
}

export const PLAYFUL_P = 0.25;

/** Never armed: exits, gambled destinations, the résumé, the casino, new-tab/download links. */
export function eligible(a: LinkLike): boolean {
  if (!a.hasAttribute('data-playful')) return false;
  if (a.hasAttribute('data-escape') || a.hasAttribute('data-dest')) return false;
  if (a.hasAttribute('target') || a.hasAttribute('download')) return false;
  const href = a.getAttribute('href') ?? '';
  if (/\/resume\/?(\?|#|$)|\/casino\/?(\?|#|$)|\/rick\/?(\?|#|$)|resume\.pdf/.test(href))
    return false;
  return true;
}

/** Pure selection: one random sample per link; nothing armed right after a rickroll. */
export function armPlayful<T extends LinkLike>(
  links: readonly T[],
  rng: () => number,
  lastWasRick: boolean,
): T[] {
  if (lastWasRick) return [];
  return links.filter((a) => eligible(a) && rng() < PLAYFUL_P);
}

export interface ClickLike {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  altKey: boolean;
  defaultPrevented?: boolean;
}
export function isPlainActivation(e: ClickLike): boolean {
  return (
    !e.defaultPrevented && e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey
  );
}
