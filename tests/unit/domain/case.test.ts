/** One test per row of the transition table (plan §G). */
import { describe, expect, it } from 'vitest';
import {
  initialCase,
  phase,
  progressPath,
  reduce,
  replay,
  type CaseState,
} from '../../../src/domain/case';
import type { CaseEvent } from '../../../src/domain/events';

const SEED = 4242;
const OPEN: CaseEvent = { t: 'RESUME_REQUESTED', via: 'cta' };
const SCOPE: CaseEvent = { t: 'SCOPE_STATED', lane: 'plt' };
const FULL: CaseEvent = { t: 'RESUME_REQUESTED', via: 'full-document' };
const RELEASE: CaseEvent = { t: 'RELEASE_ATTEMPTED' };
const CEREMONY_DONE: CaseEvent = { t: 'STEP_COMPLETED', step: 'ceremony' };
const FINDINGS_DONE: CaseEvent = { t: 'STEP_COMPLETED', step: 'findings' };
const ACK: CaseEvent = { t: 'ACKNOWLEDGED' };
const APPEAL: CaseEvent = { t: 'APPEAL_REQUESTED' };

const run = (...events: CaseEvent[]): CaseState => replay(SEED, events).state;
const TO_RELEASE = [OPEN, SCOPE, FULL];
const TO_CEREMONY = [...TO_RELEASE, RELEASE, RELEASE, RELEASE];
const TO_ACK = [...TO_CEREMONY, CEREMONY_DONE, FINDINGS_DONE];

describe('transition table', () => {
  it('row 1: authorized ignores everything (same reference)', () => {
    const s = run(OPEN, { t: 'BYPASS_REQUESTED' });
    for (const e of [OPEN, ACK, RELEASE, { t: 'PRINT_REQUESTED' } as CaseEvent])
      expect(reduce(s, e)).toBe(s);
  });

  it('rows 2–4: overrides authorize from any non-authorized phase', () => {
    for (const prefix of [[], [OPEN], TO_RELEASE, TO_CEREMONY, TO_ACK]) {
      expect(run(...prefix, { t: 'BYPASS_REQUESTED' }).authorized).toEqual({ via: 'expedited' });
      expect(run(...prefix, { t: 'PRINT_REQUESTED' }).authorized).toEqual({ via: 'print-amnesty' });
      expect(run(...prefix, { t: 'SERVICE_UNAVAILABLE', step: 'scope' }).authorized).toEqual({
        via: 'default-approval',
      });
    }
  });

  it('row 5: the CTA opens the case at scope', () => {
    const s = run(OPEN);
    expect(phase(s)).toBe('scope');
    expect(s.opened).toBe(true);
    expect(s.requests).toBe(1);
    expect(s.enteredAt).toBe(0);
  });

  it('row 6: stating the scope moves to preview and records the lane', () => {
    const s = run(OPEN, SCOPE);
    expect(phase(s)).toBe('preview');
    expect(s.lane).toBe('plt');
  });

  it('row 7: asking again moves to release and is a repeated request', () => {
    const s = run(...TO_RELEASE);
    expect(phase(s)).toBe('release');
    expect(s.requests).toBe(2);
    expect(s.findings.REPEATED_REQUEST).toEqual({ count: 1, firstAt: 2 });
  });

  it('row 8: the first two release attempts are resisted', () => {
    const s = run(...TO_RELEASE, RELEASE, RELEASE);
    expect(phase(s)).toBe('release');
    expect(s.resisted).toBe(2);
    expect(s.findings.PERSISTENCE?.count).toBe(2);
  });

  it('row 9: the third attempt releases to the ceremony', () => {
    const s = run(...TO_CEREMONY);
    expect(phase(s)).toBe('ceremony');
    expect(s.resisted).toBe(2);
  });

  it('row 10: completing the ceremony moves to findings', () => {
    expect(phase(run(...TO_CEREMONY, CEREMONY_DONE))).toBe('findings');
  });

  it('row 11: skipping the ceremony moves to findings and is recorded', () => {
    const s = run(...TO_CEREMONY, { t: 'STEP_SKIPPED', step: 'ceremony' });
    expect(phase(s)).toBe('findings');
    expect(s.findings.CEREMONY_DECLINED?.count).toBe(1);
  });

  it('row 12: proceeding from findings starts acknowledgment', () => {
    const s = run(...TO_ACK);
    expect(phase(s)).toBe('acknowledgment');
    expect(s.ack).toBe('pending');
  });

  it('row 13: the first acknowledgment asks for confirmation', () => {
    const s = run(...TO_ACK, ACK);
    expect(phase(s)).toBe('acknowledgment');
    expect(s.ack).toBe('acknowledged');
  });

  it('row 14: confirming authorizes (adjudicated)', () => {
    expect(run(...TO_ACK, ACK, ACK).authorized).toEqual({ via: 'adjudicated' });
  });

  it('row 15: an appeal is granted once, from either screen', () => {
    expect(run(...TO_ACK, APPEAL).ack).toBe('appealed');
    expect(run(...TO_ACK, ACK, APPEAL).ack).toBe('appealed');
    const s = run(...TO_ACK, APPEAL);
    expect(reduce(s, APPEAL)).toBe(s);
  });

  it('row 16: continuing after an appeal authorizes (appeal-reconciled)', () => {
    expect(run(...TO_ACK, APPEAL, ACK).authorized).toEqual({ via: 'appeal-reconciled' });
    expect(run(...TO_ACK, ACK, APPEAL, ACK).authorized).toEqual({ via: 'appeal-reconciled' });
  });

  it('row 17: dismissing the arrival notice is recorded once, in arrival only', () => {
    const s = run({ t: 'NOTICE_DISMISSED' });
    expect(s.findings.ACKNOWLEDGMENT_DECLINED?.count).toBe(1);
    expect(s.noticeDismissed).toBe(true);
    expect(reduce(s, { t: 'NOTICE_DISMISSED' })).toBe(s);
    const opened = run(OPEN);
    expect(reduce(opened, { t: 'NOTICE_DISMISSED' })).toBe(opened);
  });

  it('row 18: ambient evidence counts up to its cap and never moves the step', () => {
    let s = run(...TO_RELEASE);
    for (let i = 0; i < 5; i++) {
      s = reduce(s, { t: 'EXTERNAL_CONSULTATION', duration: 'brief' });
      s = reduce(s, { t: 'TEXT_COPIED', target: 'contact' });
      s = reduce(s, { t: 'SESSION_RELOADED' });
    }
    expect(phase(s)).toBe('release');
    expect(s.findings.EXTERNAL_CONSULTATION?.count).toBe(3);
    expect(s.findings.EXTRACTION?.count).toBe(3);
    expect(s.findings.CASE_CONTINUITY?.count).toBe(3);
    // Consultation and reload continuity need an open case; copying counts from arrival.
    const arrival = initialCase(SEED);
    expect(reduce(arrival, { t: 'EXTERNAL_CONSULTATION', duration: 'brief' })).toBe(arrival);
    expect(reduce(arrival, { t: 'SESSION_RELOADED' })).toBe(arrival);
    expect(
      reduce(arrival, { t: 'TEXT_COPIED', target: 'contact' }).findings.EXTRACTION?.count,
    ).toBe(1);
  });

  it('row 19: out-of-place events are ignored (same reference)', () => {
    const cases: [CaseEvent[], CaseEvent][] = [
      [[], SCOPE],
      [[], FULL],
      [[OPEN], OPEN],
      [[OPEN], RELEASE],
      [TO_RELEASE, CEREMONY_DONE],
      [TO_CEREMONY, FINDINGS_DONE],
      [TO_CEREMONY, RELEASE],
      [TO_ACK, CEREMONY_DONE],
      [[OPEN, SCOPE], ACK],
    ];
    for (const [prefix, e] of cases) {
      const s = run(...prefix);
      expect(reduce(s, e), `${phase(s)} + ${e.t}`).toBe(s);
    }
  });
});

describe('replay and progress', () => {
  it('keeps only accepted events in the canonical log', () => {
    const { accepted, state } = replay(SEED, [OPEN, OPEN, SCOPE, ACK, FULL]);
    expect(accepted).toEqual([OPEN, SCOPE, FULL]);
    expect(state.index).toBe(3);
  });

  it('progressPath reaches authorization from arrival in 10 events (11 with an appeal)', () => {
    const path = progressPath(initialCase(SEED));
    expect(path).toHaveLength(10);
    expect(run(...TO_ACK, ACK, APPEAL, ACK).index).toBe(11);
    expect(run(...path).authorized).toEqual({ via: 'adjudicated' });
    expect(progressPath(run(OPEN, { t: 'BYPASS_REQUESTED' }))).toEqual([]);
  });
});
