import { describe, expect, it } from 'vitest';
import {
  chooseOutcome,
  pickWedge,
  targetRotation,
  wedgeAt,
  type Outcome,
} from '../../../src/scenes/casino/logic';
import { WEDGES } from '../../../src/content/copy/casino';
import { mulberry32 } from '../../../src/lib/rng';

describe('chooseOutcome', () => {
  it('spin 1 always rickrolls; spin 3+ always pays', () => {
    for (const s of [0, 0.5, 0.999]) expect(chooseOutcome(1, s)).toBe('RICKROLL');
    for (const a of [3, 4, 99])
      for (const s of [0, 0.5, 0.999]) expect(chooseOutcome(a, s)).toBe('HYPERLINK');
  });
  it('spin 2 follows the published-ish odds at every boundary', () => {
    const cases: [number, Outcome][] = [
      [0, 'RICKROLL'],
      [0.4499999, 'RICKROLL'],
      [0.45, 'RIP'],
      [0.7999999, 'RIP'],
      [0.8, 'HYPERLINK'],
      [0.8499999, 'HYPERLINK'],
      [0.85, 'DOUBLE OR NOTHING'],
      [0.9999999, 'DOUBLE OR NOTHING'],
    ];
    for (const [s, o] of cases) expect(chooseOutcome(2, s)).toBe(o);
  });
  it('rejects invalid attempts and samples', () => {
    for (const a of [0, 1.5, -1, Number.NaN])
      expect(() => chooseOutcome(a, 0.5)).toThrow(RangeError);
    for (const s of [-0.01, 1, Number.NaN]) expect(() => chooseOutcome(2, s)).toThrow(RangeError);
  });
});

describe('pickWedge', () => {
  it('only returns wedges with the chosen label, each often enough', () => {
    const r = mulberry32(99);
    for (const o of new Set(WEDGES)) {
      const counts = new Map<number, number>();
      for (let i = 0; i < 10_000; i++) {
        const w = pickWedge(o, r());
        expect(WEDGES[w]).toBe(o);
        counts.set(w, (counts.get(w) ?? 0) + 1);
      }
      const n = WEDGES.filter((x) => x === o).length;
      expect(counts.size).toBe(n);
      for (const c of counts.values()) expect(c / 10_000).toBeGreaterThan(1 / n - 0.1);
    }
  });
  it('handles the sample edges', () => {
    expect(pickWedge('RICKROLL', 0)).toBe(0);
    expect(pickWedge('RICKROLL', 0.9999999)).toBe(7);
  });
});

describe('wheel geometry', () => {
  it('wedgeAt maps rotations to the wedge under the pointer', () => {
    const table: [number, number][] = [
      [0, 0],
      [44.9, 7],
      [45, 7],
      [90, 6],
      [315, 1],
      [359.9, 0],
      [360, 0],
      [-45, 1],
      [720 + 180, 4],
    ];
    for (const [r, w] of table) expect(wedgeAt(r)).toBe(w);
  });
  it('targetRotation always lands inside the chosen wedge, moving forward at least a turn', () => {
    for (let wedge = 0; wedge < 8; wedge++)
      for (const jitter of [0, 0.5, 0.999])
        for (const turns of [1, 5, 7])
          for (const current of [0, 123.4, 3600.5, 7199.9]) {
            const t = targetRotation(current, wedge, turns, jitter);
            expect(wedgeAt(t)).toBe(wedge);
            expect(t).toBeGreaterThan(current + 360);
            // at least 7.5° from either wedge boundary
            const into = ((((360 - (t % 360)) % 360) + 360) % 360) - wedge * 45;
            expect(into).toBeGreaterThanOrEqual(7.5 - 1e-9);
            expect(into).toBeLessThanOrEqual(37.5 + 1e-9);
          }
  });
});
