import { describe, expect, it } from 'vitest';
import {
  identityReducer,
  initialIdentity,
  snapshot,
  type IdentityEvent,
  type IdentityState,
} from '../../src/scenes/identity/logic';
import {
  generateVendors,
  initialStates,
  pageSlice,
  PAGES,
  toggle,
  TOTAL,
} from '../../src/scenes/vendors/logic';
import { makeBiscotti } from '../../src/scenes/cookie-banner/logic';
import { biscotti, namedPartners, vendorWords } from '../../src/content/copy/cookies';

const run = (events: IdentityEvent[], s: IdentityState = initialIdentity) =>
  events.reduce(identityReducer, s);

describe('identity state machine', () => {
  it('Clippy → submit → keep → verify → continue keeps claimed = clippy (source bug fixed)', () => {
    const s = run([
      { t: 'OPEN' },
      { t: 'SELECT', id: 'clippy' },
      { t: 'SUBMIT' },
      { t: 'KEEP' },
      { t: 'VERIFY_TEXT', text: 'casserole' },
      { t: 'CONTINUE' },
    ]);
    expect(s.phase).toBe('complete');
    expect(s.claimed).toBe('clippy');
    expect(s.confirmation).toBe('keep');
    expect(snapshot(s)).toEqual({ claimed: 'clippy', refused: false, confirmation: 'keep' });
    expect(JSON.stringify(snapshot(s))).not.toContain('casserole');
  });
  it('DOUBLE and CHECK_PROMPT set only the confirmation', () => {
    const base = run([{ t: 'OPEN' }, { t: 'SELECT', id: 'human' }, { t: 'SUBMIT' }]);
    expect(identityReducer(base, { t: 'DOUBLE' })).toMatchObject({
      claimed: 'human',
      confirmation: 'double',
      phase: 'final',
    });
    expect(identityReducer(base, { t: 'CHECK_PROMPT' })).toMatchObject({
      claimed: 'human',
      confirmation: 'prompt',
      phase: 'final',
    });
  });
  it('SUBMIT without a selection shows the empty error', () => {
    const s = run([{ t: 'OPEN' }, { t: 'SUBMIT' }]);
    expect(s).toMatchObject({ phase: 'choose', error: 'empty' });
  });
  it('REFUSE jumps to the result', () => {
    expect(run([{ t: 'OPEN' }, { t: 'REFUSE' }])).toMatchObject({ phase: 'result', refused: true });
  });
  it('CHANGE returns to choose, keeping the pending choice', () => {
    const s = run([{ t: 'OPEN' }, { t: 'SELECT', id: 'gemini' }, { t: 'SUBMIT' }, { t: 'CHANGE' }]);
    expect(s).toMatchObject({ phase: 'choose', pending: 'gemini', confirmation: null });
  });
  it('SKIP_FINAL records the skip', () => {
    const s = run([
      { t: 'OPEN' },
      { t: 'SELECT', id: 'claude' },
      { t: 'SUBMIT' },
      { t: 'KEEP' },
      { t: 'SKIP_FINAL' },
    ]);
    expect(s).toMatchObject({ phase: 'result', finalSkipped: true });
  });
  it('CLOSE dismisses from every open phase and is ignored otherwise', () => {
    const phases: IdentityEvent[][] = [
      [{ t: 'OPEN' }],
      [{ t: 'OPEN' }, { t: 'SELECT', id: 'other' }, { t: 'SUBMIT' }],
      [{ t: 'OPEN' }, { t: 'SELECT', id: 'other' }, { t: 'SUBMIT' }, { t: 'KEEP' }],
      [{ t: 'OPEN' }, { t: 'REFUSE' }],
    ];
    for (const evs of phases)
      expect(identityReducer(run(evs), { t: 'CLOSE' }).phase).toBe('dismissed');
    expect(identityReducer(initialIdentity, { t: 'CLOSE' }).phase).toBe('idle');
  });
  it('REPLAY after completion starts a fresh choose, pre-selecting the old claim', () => {
    const done = run([
      { t: 'OPEN' },
      { t: 'SELECT', id: 'chatgpt' },
      { t: 'SUBMIT' },
      { t: 'KEEP' },
      { t: 'SKIP_FINAL' },
      { t: 'CONTINUE' },
    ]);
    const again = identityReducer(done, { t: 'REPLAY' });
    expect(again).toMatchObject({
      phase: 'choose',
      pending: 'chatgpt',
      claimed: 'chatgpt',
      confirmation: null,
    });
  });
  it('events in the wrong phase are no-ops', () => {
    expect(identityReducer(initialIdentity, { t: 'SUBMIT' })).toBe(initialIdentity);
    expect(identityReducer(initialIdentity, { t: 'KEEP' })).toBe(initialIdentity);
  });
});

describe('3,000 fictional partners', () => {
  const vendors = generateVendors(namedPartners, vendorWords);
  it('are exactly 3,000, unique, named partners first, deterministic', () => {
    expect(vendors).toHaveLength(TOTAL);
    expect(new Set(vendors.map((v) => v.name)).size).toBe(TOTAL);
    expect(vendors.slice(0, 6).map((v) => v.name)).toEqual(namedPartners.map((p) => p.name));
    expect(generateVendors(namedPartners, vendorWords)[1234]).toEqual(vendors[1234]);
    expect(PAGES).toBe(60);
  });
  it('start all on except DAVID ANALYTICS', () => {
    const s = initialStates(vendors);
    expect(s[0]).toBe(false);
    expect(s.slice(1).every(Boolean)).toBe(true);
  });
  it('toggling flips neighbours within the page only, never locked ones', () => {
    const s = initialStates(vendors);
    const mid = toggle(s, vendors, 10);
    expect([mid[9], mid[10], mid[11]]).toEqual([false, false, false]);
    expect(mid[8]).toBe(true);
    const first = toggle(s, vendors, 50); // first row of page 2
    expect(first[49]).toBe(true);
    expect([first[50], first[51]]).toEqual([false, false]);
    const locked = toggle(s, vendors, 1);
    expect(locked[0]).toBe(false); // DAVID ANALYTICS stays off
  });
  it('page slices are clamped', () => {
    expect(pageSlice(vendors, 1)).toHaveLength(50);
    expect(pageSlice(vendors, 999)[0]).toEqual(vendors[2950]);
  });
});

describe('biscotti', () => {
  it('50 namespaced keys, 6 kinds cycled', () => {
    const bs = makeBiscotti(biscotti.names, biscotti.kinds);
    expect(bs).toHaveLength(50);
    expect(bs[0]?.key).toBe('uvcr:biscotti:01');
    expect(bs[49]?.key).toBe('uvcr:biscotti:50');
    expect(new Set(bs.map((b) => b.kind)).size).toBe(6);
    expect(bs.every((b) => b.art.split('\n').length <= 6)).toBe(true);
  });
});
