import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  _setBackends,
  clearAll,
  listKeys,
  readRaw,
  removeRaw,
  storageAvailable,
  writeRaw,
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
