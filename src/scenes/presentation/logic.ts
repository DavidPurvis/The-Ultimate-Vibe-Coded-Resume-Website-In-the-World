/** Résumé.ppt: which transition each slide gets, and which ad-libs pop out. Pure and seeded. */
import { mulberry32 } from '../../lib/rng';

export const TRANSITIONS = [
  'fly-left',
  'spiral',
  'star-wipe',
  'blinds',
  'boomerang',
  'dissolve',
] as const;
export type Transition = (typeof TRANSITIONS)[number];

export const MAX_BURSTS = 3;
export const BURST_MS = 3000;

/** Deterministic per slide, never the same transition twice in a row (it's a professional deck). */
export function transitionsFor(count: number, seed = 1995): Transition[] {
  const rng = mulberry32(seed);
  const out: Transition[] = [];
  for (let i = 0; i < count; i++) {
    let t = TRANSITIONS[Math.floor(rng() * TRANSITIONS.length)] ?? 'fly-left';
    if (t === out[i - 1]) t = TRANSITIONS[(TRANSITIONS.indexOf(t) + 1) % TRANSITIONS.length] ?? t;
    out.push(t);
  }
  return out;
}

export interface BurstSpec {
  text: string;
  side: 'left' | 'right';
  /** Vertical position as a fraction of the slide height. */
  y: number;
  rotate: number;
}

/** One or two ad-libs per slide, from the edges, seeded by slide index. */
export function burstsFor(slide: number, adlibs: readonly string[], seed = 1995): BurstSpec[] {
  const rng = mulberry32(seed + slide * 7919);
  const n = rng() < 0.5 ? 1 : 2;
  const out: BurstSpec[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      text: adlibs[Math.floor(rng() * adlibs.length)] ?? '',
      side: i === 0 ? (rng() < 0.5 ? 'left' : 'right') : out[0]?.side === 'left' ? 'right' : 'left',
      y: 0.15 + rng() * 0.6,
      rotate: Math.round((rng() * 2 - 1) * 14),
    });
  }
  return out;
}

/** Keep at most MAX_BURSTS on screen: returns how many of the oldest to remove. */
export function overflow(visible: number, adding: number): number {
  return Math.max(0, visible + adding - MAX_BURSTS);
}

/** Slide numbers, which (like every form) skip 7. */
export function slideNumbers(count: number): number[] {
  const out: number[] = [];
  for (let n = 1; out.length < count; n++) if (!String(n).includes('7')) out.push(n);
  return out;
}
