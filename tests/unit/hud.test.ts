import { describe, expect, it } from 'vitest';
import {
  chatSchedule,
  compass,
  drain,
  fps,
  minimap,
  minimapTarget,
  playerLevel,
  pushCapped,
  slotNumbers,
  xpPercent,
} from '../../src/scenes/hud/logic';
import { mulberry32 } from '../../src/lib/rng';
import { chatHandles, chatLines, feedLines, hotbar } from '../../src/content/copy/hud';
import { POINTS } from '../../src/lib/threat';

describe('HUD arithmetic', () => {
  it('levels up one per threat point, from 1', () => {
    expect(playerLevel(0)).toBe(1);
    expect(playerLevel(2.5)).toBe(3);
    expect(playerLevel(-4)).toBe(1);
  });

  it('XP is scroll progress, clamped, and short pages count as read', () => {
    expect(xpPercent(0, 3000, 1000)).toBe(0);
    expect(xpPercent(1000, 3000, 1000)).toBe(50);
    expect(xpPercent(5000, 3000, 1000)).toBe(100);
    expect(xpPercent(-20, 3000, 1000)).toBe(0);
    expect(xpPercent(0, 800, 1000)).toBe(100);
  });

  it('turns the compass a full circle every 1,440 px', () => {
    expect(compass(0)).toEqual({ deg: 0, dir: 'N' });
    expect(compass(360)).toEqual({ deg: 90, dir: 'E' });
    expect(compass(720)).toEqual({ deg: 180, dir: 'S' });
    expect(compass(1440)).toEqual({ deg: 0, dir: 'N' });
    expect(compass(180).dir).toBe('NE');
    expect(compass(-360).deg).toBe(270);
  });

  it('maps page blocks and the viewport onto the minimap', () => {
    const m = minimap(
      [
        { top: 0, height: 500 },
        { top: 500, height: 1 },
      ],
      { height: 1000, scrollY: 250, viewport: 500 },
      { w: 110, h: 210, pad: 5 },
    );
    expect(m.blocks[0]).toEqual({ x: 5, y: 5, w: 100, h: 100 });
    expect(m.blocks[1]?.h).toBe(1); // never vanishes
    expect(m.view).toEqual({ x: 5, y: 55, w: 100, h: 100 });
  });

  it('clicking the minimap centres the viewport on that point, within the page', () => {
    const page = { height: 1000, viewport: 200 };
    const canvas = { h: 210, pad: 5 };
    expect(minimapTarget(105, page, canvas)).toBe(400);
    expect(minimapTarget(0, page, canvas)).toBe(0);
    expect(minimapTarget(500, page, canvas)).toBe(800);
  });

  it('schedules chat deterministically without repeating a line back to back', () => {
    const a = chatSchedule(mulberry32(7), chatHandles, chatLines, 200);
    const b = chatSchedule(mulberry32(7), chatHandles, chatLines, 200);
    expect(a).toEqual(b);
    for (let i = 1; i < a.length; i++) expect(a[i]?.[1]).not.toBe(a[i - 1]?.[1]);
    for (const [h, l] of a) {
      expect(chatHandles).toContain(h);
      expect(chatLines).toContain(l);
    }
    expect(chatSchedule(() => 0, ['a'], ['only'], 3)).toEqual([
      ['a', 'only'],
      ['a', 'only'],
      ['a', 'only'],
    ]);
  });

  it('measures FPS from frame times', () => {
    expect(fps([])).toBe(0);
    expect(fps([16.67, 16.67, 16.66])).toBe(60);
    expect(fps([0, 33.3])).toBe(30);
    expect(fps([0.1])).toBe(999);
  });

  it('drains meters within 0–100', () => {
    expect(drain(100, 1000, 0.5)).toBe(99.5);
    expect(drain(1, 10_000, 5)).toBe(0);
    expect(drain(100, 1000, -5)).toBe(100);
  });

  it('numbers hotbar slots without a 7', () => {
    expect(slotNumbers(9)).toEqual([1, 2, 3, 4, 5, 6, 8, 9, 10]);
    expect(slotNumbers(hotbar.length)).toHaveLength(hotbar.length);
    expect(slotNumbers(20).some((n) => String(n).includes('7'))).toBe(false);
  });

  it('keeps only the newest items', () => {
    expect(pushCapped([1, 2, 3], 4, 3)).toEqual([2, 3, 4]);
    expect(pushCapped([], 'a', 2)).toEqual(['a']);
  });

  it('has a kill-feed line for every Department event', () => {
    expect(Object.keys(feedLines).sort()).toEqual(Object.keys(POINTS).sort());
  });
});
