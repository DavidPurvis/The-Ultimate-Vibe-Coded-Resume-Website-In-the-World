import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  _setBackends,
  clearAll,
  DEFAULT_PREFS,
  DEFAULT_SESSION,
  listKeys,
  readPrefs,
  readSession,
  storageAvailable,
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

describe('prefs', () => {
  it('defaults when missing', () => expect(readPrefs()).toEqual(DEFAULT_PREFS));
  it('defaults on malformed JSON', () => {
    local.setItem('uvcr:prefs', '{nope');
    expect(readPrefs()).toEqual(DEFAULT_PREFS);
  });
  it('defaults on a different schema version', () => {
    local.setItem('uvcr:prefs', JSON.stringify({ v: 2, mode: 'recruiter' }));
    expect(readPrefs()).toEqual(DEFAULT_PREFS);
  });
  it('resets only the wrongly-typed field and drops unknown fields', () => {
    local.setItem('uvcr:prefs', JSON.stringify({ v: 1, mode: 'recruiter', theme: 42, evil: true }));
    const p = readPrefs();
    expect(p.mode).toBe('recruiter');
    expect(p.theme).toBe('system');
    expect(p).not.toHaveProperty('evil');
  });
  it('writePrefs merges', () => {
    writePrefs({ theme: 'darker' });
    writePrefs({ mode: 'recruiter' });
    expect(readPrefs()).toMatchObject({ theme: 'darker', mode: 'recruiter', v: 1 });
  });
});

describe('session', () => {
  it('defaults and merges', () => {
    expect(readSession()).toEqual(DEFAULT_SESSION);
    writeSession({ threat: 3.5, casino: { github: 2 } });
    expect(readSession()).toMatchObject({ threat: 3.5, casino: { github: 2 } });
  });
  it('sanitises nested snapshots', () => {
    session.setItem(
      'uvcr:session',
      JSON.stringify({
        v: 1,
        casino: { github: -1, linkedin: 2, bogus: 9 },
        captcha: { round: 'nope', totalRejections: 'x' },
      }),
    );
    const s = readSession();
    expect(s.casino).toEqual({ linkedin: 2 });
    expect(s.captcha).toMatchObject({ round: 'windows', totalRejections: 0 });
  });
});

describe('keys and clearing', () => {
  it('lists only namespaced keys with byte sizes and clears only them', () => {
    writePrefs({ theme: 'dark' });
    writeSession({ threat: 1 });
    writeRaw('local', 'uvcr:biscotti:01', '{"name":"Gerald"}');
    local.setItem('someone-else', 'keep me');
    const keys = listKeys();
    expect(keys.map((k) => k.key)).toEqual(['uvcr:biscotti:01', 'uvcr:prefs', 'uvcr:session']);
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
    expect(readPrefs()).toEqual(DEFAULT_PREFS);
    writePrefs({ theme: 'comic' });
    expect(readPrefs().theme).toBe('comic');
  });
});
