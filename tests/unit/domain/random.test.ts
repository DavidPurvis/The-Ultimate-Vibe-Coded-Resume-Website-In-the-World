import { describe, expect, it } from 'vitest';
import { derive, fnv1a32, isSeed, mulberry32, newSeed } from '../../../src/domain/random';

const take = (r: () => number, n: number) => Array.from({ length: n }, () => r());

describe('random', () => {
  it('mulberry32 is deterministic and in [0, 1)', () => {
    const a = take(mulberry32(42), 50);
    expect(take(mulberry32(42), 50)).toEqual(a);
    expect(a.every((x) => x >= 0 && x < 1)).toBe(true);
    expect(take(mulberry32(43), 5)).not.toEqual(a.slice(0, 5));
  });

  it('fnv1a32 matches the reference values', () => {
    expect(fnv1a32('')).toBe(0x811c9dc5);
    expect(fnv1a32('a')).toBe(0xe40c292c);
    expect(fnv1a32('foobar')).toBe(0xbf9cf968);
  });

  it('streams are independent: adding a consumer never shifts another', () => {
    const before = take(derive(7, 'case-number'), 6);
    take(derive(7, 'risk'), 100);
    expect(take(derive(7, 'case-number'), 6)).toEqual(before);
    expect(take(derive(7, 'risk'), 6)).not.toEqual(before);
  });

  it('validates seeds and makes new ones in range', () => {
    expect(isSeed(0)).toBe(true);
    expect(isSeed(0xffffffff)).toBe(true);
    for (const bad of [-1, 0x100000000, 1.5, '1', null, Number.NaN])
      expect(isSeed(bad)).toBe(false);
    for (let i = 0; i < 20; i++) expect(isSeed(newSeed())).toBe(true);
  });
});
