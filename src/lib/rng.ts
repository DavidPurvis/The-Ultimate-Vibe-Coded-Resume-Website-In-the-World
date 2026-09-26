/** Deterministic PRNG (mulberry32). ?seed=<uint32> rigs the rigged wheel; tests use it too. */
export type Rng = () => number;

export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFrom(search: string): number | null {
  const s = new URLSearchParams(search).get('seed');
  if (s === null || !/^\d{1,10}$/.test(s)) return null;
  const n = Number(s);
  return n <= 0xffffffff ? n : null;
}

export function makeRng(search = typeof location === 'undefined' ? '' : location.search): Rng {
  const seed = seedFrom(search);
  if (seed !== null) return mulberry32(seed);
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return mulberry32(buf[0] ?? 1);
}
