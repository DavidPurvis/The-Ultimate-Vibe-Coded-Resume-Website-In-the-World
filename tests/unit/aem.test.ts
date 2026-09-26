import { describe, expect, it } from 'vitest';
import { createSim, ROAD, runFor, score, stepSim, winner } from '../../src/scenes/aem/logic';

describe('adaptive early merge simulation', () => {
  it('is deterministic for a seed', () => {
    const a = score(runFor(createSim('zipper', 7_000), 60));
    const b = score(runFor(createSim('zipper', 7_000), 60));
    expect(a).toEqual(b);
  });

  it('cars never overlap in a lane and the ending lane never passes the merge point', () => {
    for (const strategy of ['zipper', 'aem'] as const) {
      const sim = createSim(strategy, 42);
      for (let i = 0; i < 1800; i++) {
        stepSim(sim, 1 / 30);
        for (const lane of [0, 1] as const) {
          const xs = sim.cars
            .filter((c) => c.lane === lane)
            .map((c) => c.x)
            .sort((p, q) => p - q);
          for (let j = 1; j < xs.length; j++)
            expect(xs[j]! - xs[j - 1]!).toBeGreaterThanOrEqual(ROAD.carLen + ROAD.minGap - 1e-6);
        }
        for (const c of sim.cars)
          if (c.lane === 1) expect(c.x).toBeLessThanOrEqual(ROAD.mergePoint);
      }
    }
  });

  it('AEM merges earlier than the zipper, and only the zipper gets honked at', () => {
    const z = score(runFor(createSim('zipper', 99), 120));
    const a = score(runFor(createSim('aem', 99), 120));
    expect(a.avgMergeAt).not.toBeNull();
    expect(z.avgMergeAt).not.toBeNull();
    expect(a.avgMergeAt!).toBeLessThan(z.avgMergeAt!);
    expect(a.honks).toBe(0);
    expect(z.honks).toBeGreaterThan(0);
    expect(z.throughputPerMin).toBeGreaterThan(0);
  });

  it('the verdict is AEM regardless of the data', () => {
    const z = score(runFor(createSim('zipper', 1), 120));
    const a = score(runFor(createSim('aem', 1), 120));
    expect(winner(z, a)).toBe('aem');
    expect(winner({ ...z, throughputPerMin: 999 }, { ...a, throughputPerMin: 0 })).toBe('aem');
    expect(a.vibes).toBe(100);
  });
});
