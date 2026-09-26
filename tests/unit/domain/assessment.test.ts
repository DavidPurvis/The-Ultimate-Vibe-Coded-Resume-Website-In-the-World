import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  SERVICE_IDS,
  caseNumber,
  ceremonyIndex,
  processingMs,
  riskScore,
  serviceRows,
} from '../../../src/domain/assessment';
import { initialCase, replay } from '../../../src/domain/case';
import { BUDGET } from '../../../src/domain/steps';
import type { CaseEvent } from '../../../src/domain/events';

const seed = fc.integer({ min: 0, max: 0xffffffff });
const TO_CEREMONY: CaseEvent[] = [
  { t: 'RESUME_REQUESTED', via: 'cta' },
  { t: 'EXTERNAL_CONSULTATION', duration: 'brief' },
  { t: 'SCOPE_STATED', lane: 'emb' },
  { t: 'RESUME_REQUESTED', via: 'full-document' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'RELEASE_ATTEMPTED' },
];

describe('assessment', () => {
  it('case numbers are stable, six digits, and never contain a 7', () => {
    fc.assert(
      fc.property(seed, (s) => {
        const n = caseNumber(s);
        expect(n).toMatch(/^DRV-[1-9]\d{5}$/);
        expect(n).not.toContain('7');
        expect(caseNumber(s)).toBe(n);
      }),
    );
  });

  it('the risk score is deterministic, below 1, and names its primary contributor', () => {
    const quiet = riskScore(initialCase(9));
    expect(quiet).toEqual(riskScore(initialCase(9)));
    expect(quiet.primary).toBeNull();
    const s = replay(9, TO_CEREMONY).state;
    const r = riskScore(s);
    expect(r.value).toMatch(/^0\.\d{4}$/);
    expect(Number(r.value)).toBeGreaterThan(Number(quiet.value) - 0.1);
    expect(r.primary).toBe('PERSISTENCE');
    fc.assert(fc.property(seed, (x) => Number(riskScore(initialCase(x)).value) < 1));
  });

  it('eleven services, within the climax budget, citing only earlier findings', () => {
    fc.assert(
      fc.property(seed, (x) => {
        const rows = serviceRows(replay(x, TO_CEREMONY).state);
        expect(rows.map((r) => r.id)).toEqual([...SERVICE_IDS]);
        expect(rows.reduce((n, r) => n + r.latencyMs, 0)).toBeLessThanOrEqual(BUDGET.climaxMaxMs);
        expect(rows.every((r) => r.latencyMs > 0)).toBe(true);
      }),
    );
    const rows = serviceRows(replay(9, TO_CEREMONY).state);
    const cites = Object.fromEntries(rows.map((r) => [r.id, r.cites]));
    expect(cites.persistence).toBe('PERSISTENCE');
    expect(cites.consultation).toBe('EXTERNAL_CONSULTATION');
    expect(cites.intake).toBe('REPEATED_REQUEST');
    expect(serviceRows(initialCase(9)).every((r) => r.cites === null)).toBe(true);
  });

  it('bullet choice and processing delays stay in range', () => {
    fc.assert(
      fc.property(seed, fc.integer({ min: 1, max: 12 }), (x, n) => {
        const i = ceremonyIndex(x, n);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(n);
        const ms = processingMs(x, 'scope');
        expect(ms).toBeGreaterThanOrEqual(BUDGET.processingMs.min);
        expect(ms).toBeLessThanOrEqual(BUDGET.processingMs.max);
      }),
    );
    expect(ceremonyIndex(1, 0)).toBe(0);
  });
});
