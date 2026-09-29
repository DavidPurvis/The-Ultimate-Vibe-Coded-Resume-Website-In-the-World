/** Zeno's progress bar: forever approaching, never arriving. */
export const CAP = 99.4;
export const RATE = 0.08;
export const TICK_MS = 120;
export const STATUS_MS = 1600;
export const CONTINUE_AFTER_MS = 12000;

export function nextProgress(p: number): number {
  return Math.min(CAP, p + (CAP - p) * RATE);
}
