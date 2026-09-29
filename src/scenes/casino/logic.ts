/**
 * Link Roulette — the house decides before the wheel moves. Pure functions only: the outcome is
 * chosen from (attempt, sample), then a wedge with that label, then an angle that lands the pointer
 * inside that wedge. The animation is decoration on top of a decision already made.
 */
import { WEDGES } from '../../content/copy/casino';

export type Outcome = (typeof WEDGES)[number];
export const WEDGE_DEG = 360 / WEDGES.length;

/** The rigged odds, with a pity timer: spin 1 always rickrolls, spin 3+ always pays. */
export function chooseOutcome(attempt: number, sample: number): Outcome {
  if (!Number.isInteger(attempt) || attempt < 1) throw new RangeError('Invalid attempt');
  if (!(sample >= 0 && sample < 1)) throw new RangeError('Invalid sample');
  if (attempt === 1) return 'RICKROLL';
  if (attempt >= 3) return 'HYPERLINK';
  if (sample < 0.45) return 'RICKROLL';
  if (sample < 0.8) return 'RIP';
  if (sample < 0.85) return 'HYPERLINK';
  return 'DOUBLE OR NOTHING';
}

/** A wedge index carrying that outcome, chosen uniformly among the matches. */
export function pickWedge(outcome: Outcome, sample: number): number {
  const matches = WEDGES.flatMap((w, i) => (w === outcome ? [i] : []));
  const idx = Math.min(matches.length - 1, Math.max(0, Math.floor(sample * matches.length)));
  return matches[idx] ?? 0;
}

const mod360 = (r: number) => ((r % 360) + 360) % 360;

/** Which wedge sits under the 12 o'clock pointer when the wheel is rotated r degrees clockwise. */
export function wedgeAt(rotationDeg: number): number {
  return Math.floor(mod360(360 - mod360(rotationDeg)) / WEDGE_DEG) % WEDGES.length;
}

/**
 * Final rotation (always forward, at least one extra full turn) that parks the pointer inside
 * `wedge`, jittered up to ±15° from the centre so it never lands on a boundary.
 */
export function targetRotation(
  current: number,
  wedge: number,
  turns: number,
  jitterSample: number,
): number {
  const base = 360 - (wedge * WEDGE_DEG + WEDGE_DEG / 2);
  const jitter = (jitterSample * 2 - 1) * 15;
  let t = current - mod360(current) + 360 * turns + base + jitter;
  if (t <= current + 360) t += 360;
  return t;
}
