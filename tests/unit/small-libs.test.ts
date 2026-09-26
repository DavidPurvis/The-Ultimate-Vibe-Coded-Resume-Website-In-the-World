import { describe, expect, it } from 'vitest';
import { isPlainActivation } from '../../src/runtime/activation';
import { entityEncode, url } from '../../src/lib/paths';
import { identity } from '../../src/content/identity';

describe('plain activation (A8)', () => {
  it('truth table', () => {
    const base = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
    expect(isPlainActivation(base)).toBe(true);
    expect(isPlainActivation({ ...base, button: 1 })).toBe(false);
    for (const k of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      expect(isPlainActivation({ ...base, [k]: true })).toBe(false);
    }
    expect(isPlainActivation({ ...base, defaultPrevented: true })).toBe(false);
  });
});

describe('paths', () => {
  it('prefixes the base and keeps query/hash', () => {
    expect(url('/resume/')).toMatch(/\/resume\/$/);
    expect(url('/projects/?x=1#car-thing')).toMatch(/\/projects\/\?x=1#car-thing$/);
    expect(() => url('resume/')).toThrow();
  });
  it('entity-encodes every character', () => {
    expect(entityEncode('a@b')).toBe('&#97;&#64;&#98;');
  });
});

describe('identity', () => {
  it('contact links are exact', () => {
    expect(identity.github.href).toBe('https://github.com/DavidPurvis');
    expect(identity.linkedin.href).toBe('https://www.linkedin.com/in/dgp0');
    expect(identity.email).toBe('davidpurvis647@gmail.com');
  });
});
