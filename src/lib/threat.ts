/** Recruiter Threat Level — rises as the visitor engages with (or defies) the Department. */
import { readSession, writeSession } from './storage';
import { threat as copy } from '../content/copy/global';

export const POINTS = {
  identityComplete: 1,
  refused: 2,
  captchaReject: 1,
  captchaSkip: 2,
  dodge: 0.5,
  spin: 1,
  rickroll: 2,
  konami: 3,
  bannerRemoved: 5,
  gravity: 3,
  biscotti: 1,
  lightsOut: 1,
  appendix: 1,
} as const;
export type ThreatReason = keyof typeof POINTS;

export const THRESHOLDS = [0, 3, 7, 12] as const;

/** Pure: score → level index 0..3. */
export function levelIndex(score: number): number {
  let idx = 0;
  THRESHOLDS.forEach((t, i) => {
    if (score >= t) idx = i;
  });
  return idx;
}
export function level(score: number): string {
  return copy.levels[levelIndex(score)] ?? copy.levels[0] ?? 'LOW';
}

type Listener = (score: number, idx: number, changed: boolean) => void;
const listeners = new Set<Listener>();
export function onThreat(cb: Listener): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function bump(reason: ThreatReason): number {
  const before = readSession().threat;
  const after = before + POINTS[reason];
  writeSession({ threat: after });
  const changed = levelIndex(after) !== levelIndex(before);
  for (const l of listeners) l(after, levelIndex(after), changed);
  return after;
}
