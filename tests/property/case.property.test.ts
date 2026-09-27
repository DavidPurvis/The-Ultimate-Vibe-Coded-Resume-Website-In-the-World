/**
 * Invariants of the case, over arbitrary event sequences (plan §C: A2, A3, A4, A6, C1, X6).
 * If one fails, fast-check prints the shrunk counterexample and the seed to replay it.
 */
import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  initialCase,
  phase,
  progressPath,
  reduce,
  replay,
  type CaseState,
} from '../../src/domain/case';
import { LANE_CHOICES, COPY_TARGETS, parseEvent, type CaseEvent } from '../../src/domain/events';
import { BUDGET, PIPELINE } from '../../src/domain/steps';

const RUNS = { numRuns: 1000 };

const event: fc.Arbitrary<CaseEvent> = fc.oneof(
  fc.constantFrom<CaseEvent>(
    { t: 'RESUME_REQUESTED', via: 'cta' },
    { t: 'RESUME_REQUESTED', via: 'full-document' },
    { t: 'RELEASE_ATTEMPTED' },
    { t: 'STEP_COMPLETED', step: 'ceremony' },
    { t: 'STEP_COMPLETED', step: 'findings' },
    { t: 'STEP_SKIPPED', step: 'ceremony' },
    { t: 'ACKNOWLEDGED' },
    { t: 'APPEAL_REQUESTED' },
    { t: 'NOTICE_DISMISSED' },
    { t: 'SESSION_RELOADED' },
    { t: 'EXTERNAL_CONSULTATION', duration: 'brief' },
    { t: 'EXTERNAL_CONSULTATION', duration: 'extended' },
  ),
  fc.constantFrom(...LANE_CHOICES).map((lane): CaseEvent => ({ t: 'SCOPE_STATED', lane })),
  fc.constantFrom(...COPY_TARGETS).map((target): CaseEvent => ({ t: 'TEXT_COPIED', target })),
);
/**
 * Sequences mixing noise with "cooperative" moves (the next event on the progress path), so runs
 * regularly reach the deep steps (release, ceremony, acknowledgment) instead of stalling early.
 */
const COOP = 'coop' as const;
const events: fc.Arbitrary<CaseEvent[]> = fc
  .array(fc.oneof({ weight: 3, arbitrary: fc.constant(COOP) }, { weight: 2, arbitrary: event }), {
    maxLength: 40,
    size: 'max',
  })
  .map((items) => {
    const out: CaseEvent[] = [];
    let s = initialCase(0);
    for (const it of items) {
      const e = it === COOP ? progressPath(s)[0] : it;
      if (!e) continue;
      out.push(e);
      s = reduce(s, e);
    }
    return out;
  });
const override = fc.constantFrom<CaseEvent>(
  { t: 'BYPASS_REQUESTED' },
  { t: 'PRINT_REQUESTED' },
  ...PIPELINE.map((step): CaseEvent => ({ t: 'SERVICE_UNAVAILABLE', step })),
);
const seed = fc.integer({ min: 0, max: 0xffffffff });
const AMBIENT = new Set<CaseEvent['t']>([
  'EXTERNAL_CONSULTATION',
  'TEXT_COPIED',
  'SESSION_RELOADED',
  'NOTICE_DISMISSED',
]);

/** Every intermediate state of a run. */
function states(s0: CaseState, evs: readonly CaseEvent[]): CaseState[] {
  const out = [s0];
  for (const e of evs) out.push(reduce(out[out.length - 1] as CaseState, e));
  return out;
}
const visible = (s: CaseState) => {
  const { seed: _seed, ...rest } = s;
  return rest;
};

describe('case invariants', () => {
  it('A2: from any reachable state, authorization is at most 11 cooperative events away', () => {
    fc.assert(
      fc.property(seed, events, (x, evs) => {
        const s = replay(x, evs).state;
        const path = progressPath(s);
        expect(path.length).toBeLessThanOrEqual(11);
        expect(replay(x, [...evs, ...path]).state.authorized).not.toBeNull();
      }),
      RUNS,
    );
  });

  it('A3: an override authorizes any non-authorized state in exactly one event', () => {
    fc.assert(
      fc.property(seed, events, override, (x, evs, o) => {
        const s = replay(x, evs).state;
        if (s.authorized) return;
        const next = reduce(s, o);
        expect(next.authorized).not.toBeNull();
        expect(next.index).toBe(s.index + 1);
      }),
      RUNS,
    );
  });

  it('A4: authorization is irreversible and ignores everything after it', () => {
    fc.assert(
      fc.property(seed, events, override, events, (x, before, o, after) => {
        const s = reduce(replay(x, before).state, o);
        for (const e of [...after, o]) expect(reduce(s, e)).toBe(s);
      }),
      RUNS,
    );
  });

  it('A6: the seed never changes anything the reducer decides', () => {
    fc.assert(
      fc.property(seed, seed, events, (a, b, evs) => {
        expect(visible(replay(a, evs).state)).toEqual(visible(replay(b, evs).state));
      }),
      RUNS,
    );
  });

  it('C1: at most two resisted attempts and three acknowledgment screens', () => {
    fc.assert(
      fc.property(seed, events, (x, evs) => {
        const all = states(initialCase(x), evs);
        // Each accepted ACKNOWLEDGED/APPEAL_REQUESTED answers one acknowledgment screen.
        let ackScreens = 0;
        evs.forEach((e, i) => {
          const prev = all[i] as CaseState;
          const cur = all[i + 1] as CaseState;
          expect(cur.resisted).toBeLessThanOrEqual(BUDGET.maxResisted);
          const answers = e.t === 'ACKNOWLEDGED' || e.t === 'APPEAL_REQUESTED';
          if (answers && phase(prev) === 'acknowledgment' && cur !== prev) ackScreens += 1;
        });
        expect(ackScreens).toBeLessThanOrEqual(BUDGET.maxAckScreens);
      }),
      RUNS,
    );
  });

  it('ambient evidence never moves the step or grants anything', () => {
    fc.assert(
      fc.property(seed, events, (x, evs) => {
        const all = states(initialCase(x), evs);
        evs.forEach((e, i) => {
          if (!AMBIENT.has(e.t)) return;
          const prev = all[i] as CaseState;
          const cur = all[i + 1] as CaseState;
          expect(cur.step).toBe(prev.step);
          expect(cur.authorized).toBe(prev.authorized);
          expect(cur.opened).toBe(prev.opened);
        });
      }),
      RUNS,
    );
  });

  it('the canonical log replays to the same state and survives storage', () => {
    fc.assert(
      fc.property(seed, events, (x, evs) => {
        const { state, accepted } = replay(x, evs);
        expect(state.index).toBe(accepted.length);
        const stored = JSON.parse(JSON.stringify(accepted)) as unknown[];
        const parsed = stored.map(parseEvent);
        expect(parsed).toEqual(accepted);
        expect(replay(x, parsed as CaseEvent[]).state).toEqual(state);
      }),
      RUNS,
    );
  });
});
