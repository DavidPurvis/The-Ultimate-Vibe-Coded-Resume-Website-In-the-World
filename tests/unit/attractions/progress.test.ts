import { describe, expect, it } from 'vitest';
import { CAP, nextProgress } from '../../../src/scenes/progress/logic';

describe('Zeno progress', () => {
  it('is monotonic, never exceeds the cap, and gets close quickly', () => {
    let p = 0;
    let reachedAt = -1;
    for (let i = 0; i < 10_000; i++) {
      const n = nextProgress(p);
      expect(n).toBeGreaterThanOrEqual(p);
      expect(n).toBeLessThanOrEqual(CAP);
      p = n;
      if (reachedAt < 0 && p >= 99.3) reachedAt = i;
    }
    expect(reachedAt).toBeGreaterThan(0);
    // 99.4·0.92^n ≤ 0.1 → n ≈ 83 ticks (~10s at 120ms), just before "Continue anyway" at 12s.
    expect(reachedAt).toBeLessThan(90);
    expect(p).toBeLessThan(100);
  });
});
