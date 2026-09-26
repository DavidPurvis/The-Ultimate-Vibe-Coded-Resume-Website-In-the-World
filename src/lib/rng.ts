/** Legacy seeded RNG helpers for the old gag scenes. The PRNG itself lives in domain/random.ts. */
import { mulberry32, newSeed, type Rng } from '../domain/random';

export { mulberry32, type Rng };

export function seedFrom(search: string): number | null {
  const s = new URLSearchParams(search).get('seed');
  if (s === null || !/^\d{1,10}$/.test(s)) return null;
  const n = Number(s);
  return n <= 0xffffffff ? n : null;
}

export function makeRng(search = typeof location === 'undefined' ? '' : location.search): Rng {
  const seed = seedFrom(search);
  return mulberry32(seed ?? newSeed());
}
