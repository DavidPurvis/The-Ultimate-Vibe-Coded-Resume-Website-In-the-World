import { describe, expect, it } from 'vitest';
import { parseEvent, type CaseEvent } from '../../../src/domain/events';

const VALID: CaseEvent[] = [
  { t: 'RESUME_REQUESTED', via: 'cta' },
  { t: 'RESUME_REQUESTED', via: 'full-document' },
  { t: 'SCOPE_STATED', lane: 'plt' },
  { t: 'SCOPE_STATED', lane: 'unspecified' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'STEP_COMPLETED', step: 'ceremony' },
  { t: 'STEP_COMPLETED', step: 'findings' },
  { t: 'STEP_SKIPPED', step: 'ceremony' },
  { t: 'ACKNOWLEDGED' },
  { t: 'APPEAL_REQUESTED' },
  { t: 'BYPASS_REQUESTED' },
  { t: 'NOTICE_DISMISSED' },
  { t: 'PRINT_REQUESTED' },
  { t: 'SERVICE_UNAVAILABLE', step: 'ceremony' },
  { t: 'EXTERNAL_CONSULTATION', duration: 'extended' },
  { t: 'TEXT_COPIED', target: 'contact' },
  { t: 'SESSION_RELOADED' },
];

describe('parseEvent', () => {
  it('accepts every member of the union exactly as written', () => {
    for (const e of VALID) expect(parseEvent(JSON.parse(JSON.stringify(e)))).toEqual(e);
    expect(new Set(VALID.map((e) => e.t)).size).toBe(14);
  });

  it('rejects anything carrying behavioural data or extra keys', () => {
    for (const bad of [
      { t: 'RELEASE_ATTEMPTED', x: 10, y: 20 },
      { t: 'RELEASE_ATTEMPTED', pointerType: 'mouse' },
      { t: 'TEXT_COPIED', target: 'contact', text: 'davidpurvis647@gmail.com' },
      { t: 'EXTERNAL_CONSULTATION', duration: 'brief', ms: 1234 },
      { t: 'ACKNOWLEDGED', ts: 1_700_000_000_000 },
      { t: 'SCOPE_STATED', lane: 'plt', motion: 'reduced' },
    ])
      expect(parseEvent(bad), JSON.stringify(bad)).toBeNull();
  });

  it('rejects unknown types, bad enums, missing keys and non-objects', () => {
    for (const bad of [
      null,
      undefined,
      42,
      'RESUME_REQUESTED',
      [],
      {},
      { t: 'VIEWPORT_CHANGED' },
      { t: 'RESUME_REQUESTED' },
      { t: 'RESUME_REQUESTED', via: 'hover' },
      { t: 'SCOPE_STATED', lane: 'frontend' },
      { t: 'STEP_COMPLETED', step: 'release' },
      { t: 'STEP_SKIPPED', step: 'findings' },
      { t: 'SERVICE_UNAVAILABLE', step: 'disposition' },
      { t: 'EXTERNAL_CONSULTATION', duration: 3 },
      { t: 'TEXT_COPIED', target: 'clipboard' },
    ])
      expect(parseEvent(bad), JSON.stringify(bad)).toBeNull();
  });
});
