import { describe, expect, it } from 'vitest';
import {
  identityReducer,
  initialIdentity,
  snapshot,
  type IdentityEvent,
  type IdentityState,
} from '../../../src/scenes/identity/logic';
import {
  generateVendors,
  initialStates,
  pageSlice,
  PAGES,
  toggle,
  TOTAL,
} from '../../../src/scenes/vendors/logic';
import { makeBiscotti } from '../../../src/scenes/cookie-banner/logic';
import { biscotti, namedPartners, vendorWords } from '../../../src/content/copy/cookies';

const run = (events: IdentityEvent[], s: IdentityState = initialIdentity) =>
  events.reduce(identityReducer, s);
const open = () => run([{ t: 'OPEN' }]);

describe('classification', () => {
  it('opens at three first choices, with nothing declared', () => {
    const s = open();
    expect(s.phase).toBe('choose');
    expect(snapshot(s)).toBeNull();
  });

  it('Human relies on self-report, then is noted', () => {
    const s = run([{ t: 'OPEN' }, { t: 'HUMAN' }, { t: 'CONFIRM_HUMAN' }]);
    expect(s).toMatchObject({ phase: 'result', declared: 'human' });
    expect(snapshot(s)).toEqual({ declared: 'human', model: null, transcription: null });
  });

  it('Automated system reveals the models; the choice is confirmed before it counts', () => {
    const mid = run([
      { t: 'OPEN' },
      { t: 'AUTOMATED' },
      { t: 'SELECT', id: 'clippy' },
      { t: 'SUBMIT' },
    ]);
    expect(mid.phase).toBe('confirm');
    expect(snapshot(mid)).toBeNull();
    for (const [e, confirmation] of [
      ['KEEP', 'keep'],
      ['DOUBLE', 'double'],
      ['CHECK_PROMPT', 'prompt'],
    ] as const) {
      const s = identityReducer(mid, { t: e });
      expect(s).toMatchObject({ phase: 'result', declared: 'automated', confirmation });
      expect(snapshot(s)).toEqual({ declared: 'automated', model: 'clippy', transcription: null });
    }
  });

  it('Prefer not to disclose is a declaration of nondeclaration', () => {
    const s = run([{ t: 'OPEN' }, { t: 'WITHHOLD' }]);
    expect(snapshot(s)).toEqual({ declared: 'withheld', model: null, transcription: null });
    // No supplemental transcription after a withheld declaration.
    expect(identityReducer(s, { t: 'TRANSCRIBE' })).toBe(s);
  });

  it('closing before a result declares nothing (refusal is not the same as closing)', () => {
    for (const path of [
      [{ t: 'OPEN' }],
      [{ t: 'OPEN' }, { t: 'HUMAN' }],
      [{ t: 'OPEN' }, { t: 'AUTOMATED' }, { t: 'SELECT', id: 'claude' }, { t: 'SUBMIT' }],
    ] as IdentityEvent[][]) {
      const s = run([...path, { t: 'CLOSE' }]);
      expect(s.phase).toBe('dismissed');
      expect(snapshot(s)).toBeNull();
    }
  });

  it('SUBMIT without a model shows the empty error; BACK retraces one step', () => {
    const model = run([{ t: 'OPEN' }, { t: 'AUTOMATED' }]);
    expect(identityReducer(model, { t: 'SUBMIT' }).error).toBe('empty');
    const confirm = run([{ t: 'SELECT', id: 'gemini' }, { t: 'SUBMIT' }], model);
    expect(identityReducer(confirm, { t: 'BACK' })).toMatchObject({
      phase: 'model',
      pending: 'gemini',
    });
    expect(identityReducer(model, { t: 'BACK' }).phase).toBe('choose');
    expect(identityReducer(run([{ t: 'OPEN' }, { t: 'HUMAN' }]), { t: 'BACK' }).phase).toBe(
      'choose',
    );
  });

  it('transcription is optional, supplemental, and recorded only as done or skipped', () => {
    const human = run([{ t: 'OPEN' }, { t: 'HUMAN' }, { t: 'CONFIRM_HUMAN' }]);
    const done = run([{ t: 'TRANSCRIBE' }, { t: 'TRANSCRIBED' }], human);
    expect(done.phase).toBe('result');
    expect(snapshot(done)).toEqual({ declared: 'human', model: null, transcription: 'done' });
    const skipped = run([{ t: 'TRANSCRIBE' }, { t: 'SKIP_TRANSCRIPTION' }], human);
    expect(snapshot(skipped)?.transcription).toBe('skipped');
    // Closing mid-transcription keeps the declaration already made.
    expect(snapshot(run([{ t: 'TRANSCRIBE' }, { t: 'CLOSE' }], human))).toEqual(snapshot(human));
    // The state has nowhere to put transcribed text.
    expect(Object.keys(done)).not.toContain('finalText');
  });

  it('reopening starts over at the first question; events out of phase are no-ops', () => {
    const declared = run([{ t: 'OPEN' }, { t: 'WITHHOLD' }, { t: 'CLOSE' }]);
    expect(identityReducer(declared, { t: 'OPEN' })).toEqual({
      ...initialIdentity,
      phase: 'choose',
    });
    const choosing = open();
    expect(identityReducer(choosing, { t: 'OPEN' })).toBe(choosing);
    for (const e of [
      { t: 'CONFIRM_HUMAN' },
      { t: 'SUBMIT' },
      { t: 'KEEP' },
      { t: 'TRANSCRIBED' },
      { t: 'SKIP_TRANSCRIPTION' },
      { t: 'TRANSCRIBE' },
      { t: 'SELECT', id: 'claude' },
      { t: 'BACK' },
    ] as IdentityEvent[])
      expect(identityReducer(choosing, e), e.t).toBe(choosing);
    expect(identityReducer(initialIdentity, { t: 'CLOSE' })).toBe(initialIdentity);
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
