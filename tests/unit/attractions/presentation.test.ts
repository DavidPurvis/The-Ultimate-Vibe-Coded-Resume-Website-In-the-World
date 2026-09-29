import { describe, expect, it } from 'vitest';
import {
  burstsFor,
  MAX_BURSTS,
  overflow,
  slideNumbers,
  transitionsFor,
  TRANSITIONS,
} from '../../../src/scenes/presentation/logic';

describe('Résumé.ppt', () => {
  it('assigns deterministic transitions, never the same twice in a row', () => {
    const a = transitionsFor(12);
    expect(a).toEqual(transitionsFor(12));
    for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
    for (const t of a) expect(TRANSITIONS).toContain(t);
  });

  it('pops one or two ad-libs per slide from opposite edges', () => {
    const libs = ['KA-POW!', 'RADICAL!', 'SYNERGY!!'];
    for (let s = 0; s < 20; s++) {
      const b = burstsFor(s, libs);
      expect(b.length).toBeGreaterThanOrEqual(1);
      expect(b.length).toBeLessThanOrEqual(2);
      if (b.length === 2) expect(b[0]!.side).not.toBe(b[1]!.side);
      for (const x of b) {
        expect(libs).toContain(x.text);
        expect(x.y).toBeGreaterThanOrEqual(0.15);
        expect(x.y).toBeLessThanOrEqual(0.75);
        expect(Math.abs(x.rotate)).toBeLessThanOrEqual(14);
      }
    }
  });

  it('never keeps more than three bursts on screen', () => {
    expect(overflow(0, 2)).toBe(0);
    expect(overflow(2, 2)).toBe(1);
    expect(overflow(3, 2)).toBe(2);
    expect(MAX_BURSTS).toBe(3);
  });

  it('slide numbers skip 7', () => {
    expect(slideNumbers(8)).toEqual([1, 2, 3, 4, 5, 6, 8, 9]);
    expect(slideNumbers(20).some((n) => String(n).includes('7'))).toBe(false);
  });
});
