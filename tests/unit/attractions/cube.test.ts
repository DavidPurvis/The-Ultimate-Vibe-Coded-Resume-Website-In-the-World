import { describe, expect, it } from 'vitest';
import {
  DENSITY,
  EDGE_CM,
  REPOSE,
  cellCenter,
  cellOf,
  createRain,
  kgToLb,
  massKg,
  pileHeight,
  platform,
  roll,
  settle,
  shake,
  step,
  summon,
} from '../../../src/scenes/cube/logic';
import { mulberry32 } from '../../../src/lib/rng';
import { wishlistCopy } from '../../../src/content/copy/wishlist';

const settleAll = (r: ReturnType<typeof createRain>) => {
  let t = 0;
  while (step(r, 1 / 60) > 0 && t < 30) t += 1 / 60;
  return t;
};

describe('the cube', () => {
  it('weighs what the wishlist says: about 44 pounds', () => {
    expect(EDGE_CM).toBeCloseTo(10.16);
    expect(DENSITY).toBe(19.3);
    expect(massKg()).toBeCloseTo(20.24, 1);
    expect(Math.floor(kgToLb(massKg()))).toBe(44);
    expect(wishlistCopy.heroCaption).toContain('About 44 pounds');
  });

  it('shakes the camera briefly after a heft, then holds still', () => {
    expect(shake(-1)).toEqual({ x: 0, y: 0 });
    expect(Math.hypot(shake(0.01).x, shake(0.01).y)).toBeGreaterThan(0);
    expect(Math.hypot(shake(0.5).x, shake(0.5).y)).toBeLessThan(0.01);
    expect(shake(0.6)).toEqual({ x: 0, y: 0 });
  });
});

describe('cube rain', () => {
  it('maps floor cells both ways and clamps outside the pile area', () => {
    const r = createRain(1);
    for (const c of [0, 17, 1000, r.cells * r.cells - 1]) {
      const { x, z } = cellCenter(r, c);
      expect(cellOf(r, x, z)).toBe(c);
    }
    expect(cellOf(r, -99, -99)).toBe(0);
    expect(cellOf(r, 99, 99)).toBe(r.cells * r.cells - 1);
  });

  it('never exceeds its capacity', () => {
    const r = createRain(2500);
    const rng = mulberry32(1);
    expect(summon(r, 1000, rng)).toBe(1000);
    expect(summon(r, 1000, rng)).toBe(1000);
    expect(summon(r, 1000, rng)).toBe(500);
    expect(summon(r, 1000, rng)).toBe(0);
    expect(r.count).toBe(2500);
  });

  it('lands every cube on the pile, never through the floor, and conserves volume', () => {
    const r = createRain(3000);
    platform(r, 0.8, 1.6);
    const base = r.heights.reduce((a, b) => a + b, 0);
    summon(r, 3000, mulberry32(9));
    expect(settleAll(r)).toBeLessThan(10);
    expect([...r.resting.subarray(0, r.count)].every((x) => x === 1)).toBe(true);
    for (let i = 0; i < r.count; i++) expect(r.pos[i * 3 + 1]).toBeGreaterThanOrEqual(r.size / 2);
    const added = r.heights.reduce((a, b) => a + b, 0) - base;
    expect(added).toBeCloseTo(3000 * r.size, 1);
  });

  it('is deterministic for a seed', () => {
    const a = createRain(800);
    const b = createRain(800);
    summon(a, 800, mulberry32(4));
    summon(b, 800, mulberry32(4));
    settleAll(a);
    settleAll(b);
    expect([...a.heights]).toEqual([...b.heights]);
  });

  it('keeps the heap no steeper than the angle of repose, and lands on the big cube', () => {
    const r = createRain(4000);
    platform(r, 0.8, 1.6);
    summon(r, 4000, mulberry32(2));
    settle(r);
    const h = (u: number, v: number) => r.heights[v * r.cells + u] ?? 0;
    const onCube = (u: number, v: number) => {
      const { x, z } = cellCenter(r, v * r.cells + u);
      return Math.abs(x) <= 0.8 && Math.abs(z) <= 0.8;
    };
    for (let v = 0; v < r.cells; v++)
      for (let u = 0; u + 1 < r.cells; u++) {
        // The cube's own vertical faces are allowed to be cliffs.
        if (onCube(u, v) !== onCube(u + 1, v)) continue;
        expect(Math.abs(h(u, v) - h(u + 1, v))).toBeLessThanOrEqual(
          r.size * REPOSE + r.size + 1e-6,
        );
      }
    expect(pileHeight(r)).toBeGreaterThan(1.6);
  });

  it('rolls a cube downhill to a lower neighbour', () => {
    const r = createRain(1);
    const c = 10 * r.cells + 10;
    r.heights[c] = 1;
    expect(roll(r, c)).not.toBe(c);
    expect(roll(r, 5)).toBe(5); // flat floor: stays put
  });
});
