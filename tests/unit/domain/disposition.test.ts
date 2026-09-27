import { describe, expect, it } from 'vitest';
import { replay } from '../../../src/domain/case';
import { caseNumber } from '../../../src/domain/assessment';
import { disposition } from '../../../src/domain/disposition';
import type { CaseEvent } from '../../../src/domain/events';

const run = (...events: CaseEvent[]) => replay(77, events).state;

describe('disposition', () => {
  it('exists only once authorized', () => {
    expect(disposition(run({ t: 'RESUME_REQUESTED', via: 'cta' }))).toBeNull();
  });

  it('summarizes the session and keeps the stated scope', () => {
    const d = disposition(
      run(
        { t: 'TEXT_COPIED', target: 'contact' },
        { t: 'RESUME_REQUESTED', via: 'cta' },
        { t: 'SCOPE_STATED', lane: 'be' },
        { t: 'BYPASS_REQUESTED' },
      ),
    );
    expect(d).toEqual({
      caseNumber: caseNumber(77),
      route: 'expedited',
      lane: 'be',
      statedScope: 'be',
      lines: [{ finding: 'EXTRACTION', count: 1 }],
      resistance: { used: 0, permitted: 2 },
      requests: 1,
    });
  });

  it('an unspecified scope, or none, releases the standard résumé', () => {
    expect(disposition(run({ t: 'PRINT_REQUESTED' }))?.lane).toBe('gen');
    const d = disposition(
      run(
        { t: 'RESUME_REQUESTED', via: 'cta' },
        { t: 'SCOPE_STATED', lane: 'unspecified' },
        { t: 'BYPASS_REQUESTED' },
      ),
    );
    expect(d?.lane).toBe('gen');
    expect(d?.statedScope).toBe('unspecified');
  });
});
