/**
 * The site's only PRNG. Values are drawn from stable named streams: `derive(seed, key)` gives
 * each consumer its own sequence, so adding a consumer never shifts anyone else's values.
 * Randomness may change theater (digits, latencies, which bullet is reviewed); nothing the
 * reducer reads ever comes from here.
 */
export type Rng = () => number;

/** mulberry32: small, fast, deterministic. Returns floats in [0, 1). */
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

/** 32-bit FNV-1a over UTF-16 code units. */
export function fnv1a32(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** An independent stream for one named purpose, e.g. derive(seed, 'case-number'). */
export function derive(seed: number, key: string): Rng {
  return mulberry32((seed ^ fnv1a32(key)) >>> 0);
}

export const isSeed = (n: unknown): n is number =>
  typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 0xffffffff;

/** A fresh case seed from the platform CSPRNG. */
export function newSeed(): number {
  const buf = new Uint32Array(1);
  globalThis.crypto.getRandomValues(buf);
  return (buf[0] ?? 1) >>> 0;
}
