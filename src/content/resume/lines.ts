/**
 * The few résumé lines the case on / shows (the released extract, the bullet under ceremonial
 * review), read straight from the compositions. It deliberately skips resolve(): the case needs
 * neither the FACT lines nor the selection reports, and loads this lazily with its steps.
 */
import { COMPOSITIONS } from './compositions';
import { FRAMINGS } from './framings';
import type { FramingId, LaneId } from './types';

const text = (id: FramingId) => FRAMINGS[id]?.text ?? '';

export function summaryLine(lane: LaneId): string | null {
  const s = COMPOSITIONS[lane].summary;
  return s ? text(s) : null;
}

/** Experience bullets in reading order. */
export function experienceLines(lane: LaneId): string[] {
  return COMPOSITIONS[lane].roles.flatMap((r) => r.bullets.map(text));
}
