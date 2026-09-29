/** The release control's dodge geometry (moved from the old runaway scene). */
import { describe, expect, it } from 'vitest';
import { nextPosition, shouldDodge } from '../../../src/scenes/runaway/logic';

describe('runaway geometry', () => {
  const arena = { x: 0, y: 0, w: 600, h: 240 };
  const btn = { x: 240, y: 98, w: 120, h: 44 };
  it('moves away from the pointer along the vector', () => {
    const p = nextPosition(btn, { x: 260, y: 120 }, arena, 140, 90);
    expect(p.x).toBeGreaterThan(btn.x);
  });
  it('zero-distance fallback moves right', () => {
    const p = nextPosition(btn, { x: 300, y: 120 }, arena, 140, 10);
    expect(p.x).toBeGreaterThan(btn.x);
  });
  it('clamps into the arena with padding', () => {
    const p = nextPosition({ x: 470, y: 98, w: 120, h: 44 }, { x: 400, y: 120 }, arena, 300, 10);
    expect(p.x).toBe(600 - 120 - 8);
  });
  it('escapes to the farthest corner when cornered', () => {
    const cornered = { x: 472, y: 188, w: 120, h: 44 };
    const p = nextPosition(cornered, { x: 520, y: 200 }, arena, 140, 90);
    expect(p).toEqual({ x: 8, y: 8 });
  });
  it('one approach consumes one dodge, respecting cooldown', () => {
    expect(shouldDodge(false, true, 0, 1000, 250)).toBe(true);
    expect(shouldDodge(true, true, 0, 1000, 250)).toBe(false);
    expect(shouldDodge(false, true, 900, 1000, 250)).toBe(false);
    expect(shouldDodge(false, false, 0, 1000, 250)).toBe(false);
  });
});
