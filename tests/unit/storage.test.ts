import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  _setBackends,
  clearAll,
  listKeys,
  readPrefs,
  readRaw,
  readSession,
  removeRaw,
  storageAvailable,
  validatePrefs,
  validateSession,
  writePrefs,
  writeRaw,
  writeSession,
  type KV,
} from '../../src/lib/storage';

class FakeKV implements KV {
  m = new Map<string, string>();
  getItem(k: string) {
    return this.m.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.m.set(k, v);
  }
  removeItem(k: string) {
    this.m.delete(k);
  }
  key(i: number) {
    return [...this.m.keys()][i] ?? null;
  }
  get length() {
    return this.m.size;
  }
}
class ThrowingKV extends FakeKV {
  override getItem(): string | null {
    throw new Error('SecurityError');
  }
  override setItem(): void {
    throw new Error('QuotaExceededError');
  }
}

let local: FakeKV;
let session: FakeKV;
beforeEach(() => {
  local = new FakeKV();
  session = new FakeKV();
  _setBackends({ local, session });
});
afterEach(() => _setBackends({ local: undefined, session: undefined }));

describe('keys and clearing', () => {
  it('lists only namespaced keys with byte sizes and clears only them', () => {
    writeRaw('session', 'uvcr:case', '{"v":2}');
    writeRaw('local', 'uvcr:prefs', '{}');
    writeRaw('local', 'uvcr:biscotti:01', '{"name":"Gerald"}');
    local.setItem('someone-else', 'keep me');
    const keys = listKeys();
    expect(keys.map((k) => k.key)).toEqual(['uvcr:biscotti:01', 'uvcr:case', 'uvcr:prefs']);
    expect(keys.find((k) => k.key === 'uvcr:case')?.area).toBe('session');
    expect(keys.every((k) => k.bytes > 0)).toBe(true);
    clearAll();
    expect(listKeys()).toEqual([]);
    expect(local.getItem('someone-else')).toBe('keep me');
  });
  it('refuses non-namespaced raw writes', () => {
    expect(() => writeRaw('local', 'tracking', '1')).toThrow();
  });
});

describe('failure modes', () => {
  it('falls back to memory when storage throws', () => {
    _setBackends({ local: new ThrowingKV(), session: new ThrowingKV() });
    expect(storageAvailable('local')).toBe(false);
    expect(readRaw('session', 'uvcr:case')).toBeNull();
    writeRaw('session', 'uvcr:case', 'x');
    expect(readRaw('session', 'uvcr:case')).toBe('x');
    removeRaw('session', 'uvcr:case');
    expect(readRaw('session', 'uvcr:case')).toBeNull();
  });
});

describe('preferences', () => {
  it('defaults when missing or malformed', () => {
    expect(readPrefs()).toEqual({
      v: 1,
      mode: 'chaos',
      theme: 'system',
      cookieBanner: 'pending',
      sound: false,
      hud: 'off',
    });
    local.setItem('uvcr:prefs', '{not json');
    expect(readPrefs().mode).toBe('chaos');
    local.setItem('uvcr:prefs', '[1,2]');
    expect(readPrefs().theme).toBe('system');
  });

  it('keeps every valid value of an old or partly bad record', () => {
    // The previous site's record: a version, a retired field, and one invalid value.
    expect(
      validatePrefs({ v: 1, mode: 'recruiter', theme: 'neon', notified: true, hud: 'overkill' }),
    ).toEqual({
      v: 1,
      mode: 'recruiter',
      theme: 'system',
      cookieBanner: 'pending',
      sound: false,
      hud: 'overkill',
    });
    // No version at all still keeps what is valid.
    expect(validatePrefs({ theme: 'comic' }).theme).toBe('comic');
  });

  it('writes merge into what is there and stay valid', () => {
    writePrefs({ theme: 'dark' });
    writePrefs({ cookieBanner: 'managed' });
    expect(readPrefs()).toMatchObject({ theme: 'dark', cookieBanner: 'managed' });
    expect(JSON.parse(local.getItem('uvcr:prefs') ?? '{}')).not.toHaveProperty('notified');
  });
});

describe('session', () => {
  it('defaults, including an empty case file', () => {
    expect(readSession()).toMatchObject({
      identity: null,
      captcha: null,
      casino: {},
      casinoLosses: 0,
      caseFile: { departments: [], issuedNotices: [], released: false },
    });
  });

  it('keeps valid fields, repairs bad ones, and filters the case file', () => {
    const s = validateSession({
      v: 9,
      casino: { github: 2, linkedin: -1, email: 1.5, nope: 3 },
      casinoLosses: -4,
      threat: 'high',
      appendixOpened: true,
      dodges: { hatch: 2, bad: 'x' },
      subway: { on: false, count: 5 },
      caseFile: { departments: ['cube', 'cube', 'mars'], issuedNotices: [], released: 1 },
      lastPlayfulWasRick: true,
    });
    expect(s).toMatchObject({
      v: 1,
      casino: { github: 2 },
      casinoLosses: 0,
      threat: 0,
      appendixOpened: true,
      dodges: { hatch: 2 },
      subway: { on: false, count: 0 },
      caseFile: { departments: ['cube'], issuedNotices: [], released: false },
    });
    expect(s).not.toHaveProperty('lastPlayfulWasRick');
  });

  it('migrates the previous identity shape and never keeps transcription text', () => {
    expect(validateSession({ identity: { claimed: 'claude', refused: false } }).identity).toEqual({
      declared: 'automated',
      model: 'claude',
      transcription: null,
    });
    expect(validateSession({ identity: { claimed: 'human' } }).identity?.declared).toBe('human');
    expect(validateSession({ identity: { refused: true } }).identity?.declared).toBe('withheld');
    const s = validateSession({
      identity: { declared: 'human', model: 'claude', transcription: 'the whole text' },
    });
    expect(s.identity).toEqual({ declared: 'human', model: null, transcription: null });
  });

  it('writes merge and survive a blocked backend in memory', () => {
    writeSession({ casinoLosses: 1 });
    writeSession({ appendixOpened: true });
    expect(readSession()).toMatchObject({ casinoLosses: 1, appendixOpened: true });
    _setBackends({ local: new ThrowingKV(), session: new ThrowingKV() });
    writeSession({ casinoLosses: 3 });
    expect(readSession().casinoLosses).toBe(3);
    writePrefs({ theme: 'dark' });
    expect(readPrefs().theme).toBe('dark');
  });
});
