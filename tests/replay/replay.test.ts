/**
 * Replay fixtures: a seed plus a semantic event sequence must reproduce the same phase, findings,
 * seeded cosmetics and disposition, every time. Regenerating a fixture is a deliberate act: its
 * expectations are part of the product's behaviour.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { phase, replay } from '../../src/domain/case';
import { caseNumber, ceremonyIndex, riskScore } from '../../src/domain/assessment';
import { disposition } from '../../src/domain/disposition';
import { parseEvent, type CaseEvent } from '../../src/domain/events';

interface Fixture {
  name: string;
  seed: number;
  events: CaseEvent[];
  expect: Record<string, unknown>;
}

const DIR = new URL('../fixtures/cases/', import.meta.url);
const fixtures: Fixture[] = readdirSync(DIR)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(readFileSync(new URL(f, DIR), 'utf8')) as Fixture);

function observe(seed: number, events: readonly CaseEvent[]): Record<string, unknown> {
  const { state, accepted } = replay(seed, events);
  return {
    phase: phase(state),
    via: state.authorized?.via ?? null,
    index: state.index,
    accepted: accepted.length,
    resisted: state.resisted,
    ack: state.ack,
    lane: state.lane,
    findings: Object.fromEntries(Object.entries(state.findings).map(([k, v]) => [k, v?.count])),
    caseNumber: caseNumber(seed),
    risk: riskScore(state),
    ceremonyIndexOf4: ceremonyIndex(seed, 4),
    disposition: disposition(state),
  };
}

describe('replay fixtures', () => {
  it('has the eight canonical fixtures', () => {
    expect(fixtures.map((f) => f.name).sort()).toEqual([
      'appeal',
      'consultations-capped',
      'default-mouse',
      'expedite-at-scope',
      'keyboard',
      'print-at-release',
      'reload-twice',
      'service-unavailable',
    ]);
  });

  for (const f of fixtures) {
    it(`${f.name}: reproduces exactly, twice`, () => {
      for (const e of f.events) expect(parseEvent(e), JSON.stringify(e)).toEqual(e);
      expect(observe(f.seed, f.events)).toEqual(f.expect);
      expect(observe(f.seed, f.events)).toEqual(observe(f.seed, f.events));
    });
  }

  it('keyboard and mouse produce the same case (modality never reaches the domain)', () => {
    const byName = new Map(fixtures.map((f) => [f.name, f]));
    expect(byName.get('keyboard')?.expect).toEqual(byName.get('default-mouse')?.expect);
  });
});
