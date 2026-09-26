/** DOOM player: the pieces that don't need a browser. Pure and unit-tested. */

export type DoomMessage =
  | { type: 'doom:ready' }
  | { type: 'doom:escape' }
  | { type: 'doom:progress'; left: number; total: number }
  | { type: 'doom:error'; reason: string };

/** Validate a postMessage payload from DOOM's frame; anything else is ignored. */
export function parseMessage(data: unknown): DoomMessage | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  switch (d.type) {
    case 'doom:ready':
    case 'doom:escape':
      return { type: d.type };
    case 'doom:progress': {
      const left = Number(d.left);
      const total = Number(d.total);
      if (!Number.isFinite(left) || !Number.isFinite(total) || left < 0 || total < 0) return null;
      return { type: 'doom:progress', left, total };
    }
    case 'doom:error':
      return { type: 'doom:error', reason: typeof d.reason === 'string' ? d.reason : 'unknown' };
    default:
      return null;
  }
}

/** Percentage of engine files fetched (0 before anything is known, 100 when none are left). */
export function progressPct(left: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round(((total - Math.min(left, total)) / total) * 100);
}

/** The frame's address: same origin, under the site base, sound as a query flag. */
export const engineSrc = (base: string, sound: boolean): string =>
  `${base.replace(/\/?$/, '/')}doom-engine/play.html?sound=${sound ? 1 : 0}`;

/** Dock sizes (CSS width), cycling S → M → L → S. */
export const DOCK_SIZES = ['22rem', '34rem', '48rem'] as const;
export const nextSize = (i: number): number => (i + 1) % DOCK_SIZES.length;
