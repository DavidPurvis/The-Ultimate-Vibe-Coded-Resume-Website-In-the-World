/**
 * The case record in sessionStorage: the seed and the accepted semantic events, nothing else.
 * State is never stored; it is replayed. Anything unreadable starts a fresh case silently.
 * Retention is the tab's lifetime. Nothing is ever written to localStorage.
 */
import { isSeed, newSeed } from '../domain/random';
import { parseEvent, type CaseEvent } from '../domain/events';
import { replay, type CaseState } from '../domain/case';
import { BUDGET } from '../domain/steps';
import { readRaw, writeRaw } from '../lib/storage';

export const CASE_KEY = 'uvcr:case';

/** Presentation hint for the pre-paint script only; the kernel always replays instead. */
export type Hint = 'arrival' | 'open' | 'closed';
export interface CaseRecordV2 {
  v: 2;
  seed: number;
  events: CaseEvent[];
  hint: Hint;
}

export interface Loaded {
  seed: number;
  state: CaseState;
  /** The canonical log: only events that changed the state. */
  log: CaseEvent[];
  restored: boolean;
}

export function hintOf(s: CaseState): Hint {
  if (s.authorized) return 'closed';
  return s.opened ? 'open' : 'arrival';
}

export function load(): Loaded {
  let rec: unknown = null;
  try {
    rec = JSON.parse(readRaw('session', CASE_KEY) ?? 'null');
  } catch {
    rec = null;
  }
  if (rec && typeof rec === 'object') {
    const r = rec as Partial<Record<keyof CaseRecordV2, unknown>>;
    if (r.v === 2 && isSeed(r.seed) && Array.isArray(r.events)) {
      const events = r.events
        .map(parseEvent)
        .filter((e): e is CaseEvent => e !== null)
        .slice(0, BUDGET.maxLoggedEvents);
      const { state, accepted } = replay(r.seed, events);
      return { seed: r.seed, state, log: accepted, restored: true };
    }
  }
  const seed = newSeed();
  return { seed, state: replay(seed, []).state, log: [], restored: false };
}

export function save(seed: number, log: readonly CaseEvent[], state: CaseState): void {
  const rec: CaseRecordV2 = { v: 2, seed, events: [...log], hint: hintOf(state) };
  writeRaw('session', CASE_KEY, JSON.stringify(rec));
}

export { cleanupLegacy } from './legacy';
