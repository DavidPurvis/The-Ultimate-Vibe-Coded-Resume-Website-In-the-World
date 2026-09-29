/** Evidence is only what was explicitly done; absence and unfinished work prove nothing. */
import { describe, expect, it } from 'vitest';
import { evidenceOf } from '../../../src/case/evidence';
import { defaultSession, type SessionState } from '../../../src/lib/storage';

const session = (over: Partial<SessionState> = {}): SessionState => ({
  ...defaultSession(),
  ...over,
});
const pending = { cookieBanner: 'pending' as const };

describe('evidenceOf', () => {
  it('a fresh session is no evidence at all', () => {
    expect(evidenceOf(session(), { cookieBanner: 'accepted' })).toEqual({
      classification: null,
      verification: null,
      allocationLosses: 0,
      appendixOpened: false,
      cookiePending: false,
    });
  });

  it('an explicit refusal is withheld; closing without declaring is nothing', () => {
    expect(
      evidenceOf(
        session({ identity: { declared: 'withheld', model: null, transcription: null } }),
        pending,
      ).classification,
    ).toBe('withheld');
    expect(evidenceOf(session({ identity: null }), pending).classification).toBeNull();
  });

  it('only an explicit skip is a skip; an unfinished verification is nothing', () => {
    const base = {
      round: 'cage' as const,
      roundRejections: 2,
      totalRejections: 4,
      completed: false,
    };
    expect(
      evidenceOf(session({ captcha: { ...base, method: 'skipped', completed: true } }), pending)
        .verification,
    ).toBe('skipped');
    expect(
      evidenceOf(session({ captcha: { ...base, method: null } }), pending).verification,
    ).toBeNull();
    expect(
      evidenceOf(session({ captcha: { ...base, method: 'audio', completed: true } }), pending)
        .verification,
    ).toBe('complete');
  });

  it('losses are the completed unsuccessful allocations on record; the appendix only if opened', () => {
    const e = evidenceOf(session({ casinoLosses: 2, appendixOpened: true }), pending);
    expect(e.allocationLosses).toBe(2);
    expect(e.appendixOpened).toBe(true);
    expect(e.cookiePending).toBe(true);
  });
});
