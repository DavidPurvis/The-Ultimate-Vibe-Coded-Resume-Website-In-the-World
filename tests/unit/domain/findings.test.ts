import { describe, expect, it } from 'vitest';
import { replay } from '../../../src/domain/case';
import { newFindings, selectCallbacks } from '../../../src/domain/findings';
import type { CaseEvent } from '../../../src/domain/events';

const run = (...events: CaseEvent[]) => replay(1, events).state;
const OPEN: CaseEvent = { t: 'RESUME_REQUESTED', via: 'cta' };

describe('callbacks', () => {
  it('cite only findings recorded before the current step began (C4)', () => {
    // Copied during arrival, consulted during scope.
    const s = run({ t: 'TEXT_COPIED', target: 'contact' }, OPEN, {
      t: 'EXTERNAL_CONSULTATION',
      duration: 'brief',
    });
    expect(selectCallbacks(s, 'findings')).toEqual(['EXTRACTION']);
    const later = run(
      { t: 'TEXT_COPIED', target: 'contact' },
      OPEN,
      { t: 'EXTERNAL_CONSULTATION', duration: 'brief' },
      { t: 'SCOPE_STATED', lane: 'be' },
    );
    expect(selectCallbacks(later, 'findings')).toEqual(['EXTERNAL_CONSULTATION', 'EXTRACTION']);
  });

  it('are capped per surface and ordered deterministically', () => {
    const s = run(
      { t: 'NOTICE_DISMISSED' },
      { t: 'TEXT_COPIED', target: 'other' },
      OPEN,
      { t: 'EXTERNAL_CONSULTATION', duration: 'extended' },
      { t: 'SESSION_RELOADED' },
      { t: 'SCOPE_STATED', lane: 'gen' },
      { t: 'RESUME_REQUESTED', via: 'full-document' },
      { t: 'RELEASE_ATTEMPTED' },
      { t: 'RELEASE_ATTEMPTED' },
      { t: 'RELEASE_ATTEMPTED' },
      { t: 'STEP_SKIPPED', step: 'ceremony' },
      { t: 'STEP_COMPLETED', step: 'findings' },
      { t: 'ACKNOWLEDGED' },
      { t: 'ACKNOWLEDGED' },
    );
    expect(s.authorized?.via).toBe('adjudicated');
    expect(selectCallbacks(s, 'ceremony')).toHaveLength(3);
    expect(selectCallbacks(s, 'findings')).toHaveLength(4);
    expect(selectCallbacks(s, 'disposition')).toEqual([
      'REPEATED_REQUEST',
      'PERSISTENCE',
      'EXTERNAL_CONSULTATION',
      'EXTRACTION',
      'ACKNOWLEDGMENT_DECLINED',
    ]);
  });

  it('newFindings lists what appeared since the previous state', () => {
    const a = run(OPEN);
    const b = run(OPEN, { t: 'TEXT_COPIED', target: 'case' });
    expect(newFindings(a, b)).toEqual(['EXTRACTION']);
    const c = run(OPEN, { t: 'TEXT_COPIED', target: 'case' }, { t: 'TEXT_COPIED', target: 'case' });
    expect(newFindings(b, c)).toEqual([]);
  });
});
