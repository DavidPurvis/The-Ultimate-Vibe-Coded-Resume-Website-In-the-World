import { describe, expect, it } from 'vitest';
import {
  REASONABLE,
  SUBWAY_MAX,
  clamp,
  embedUrl,
  nudge,
  playerSize,
  slot,
  subwayReducer,
  summonNote,
  videoFor,
} from '../../src/scenes/subway/logic';
import { SUBWAY_VIDEOS } from '../../src/content/copy/subway';
import { shownAll } from '../../src/content/pending';

const OFF = { on: false, count: 0 };

describe('subwayReducer', () => {
  it('summons only while on, up to the cap', () => {
    expect(subwayReducer(OFF, { type: 'summon' })).toEqual(OFF);
    let s = subwayReducer(OFF, { type: 'on' });
    for (let i = 0; i < 20; i++) s = subwayReducer(s, { type: 'summon' });
    expect(s).toEqual({ on: true, count: SUBWAY_MAX });
  });

  it('dismisses one, all, or everything when switched off', () => {
    const s = { on: true, count: 3 };
    expect(subwayReducer(s, { type: 'dismiss' })).toEqual({ on: true, count: 2 });
    expect(subwayReducer({ on: true, count: 0 }, { type: 'dismiss' }).count).toBe(0);
    expect(subwayReducer(s, { type: 'dismissAll' })).toEqual({ on: true, count: 0 });
    expect(subwayReducer(s, { type: 'off' })).toEqual(OFF);
    expect(subwayReducer({ on: false, count: 0 }, { type: 'on' })).toEqual({ on: true, count: 0 });
  });

  it('labels a reasonable amount at ten and refuses at twelve', () => {
    expect(REASONABLE).toBe(10);
    expect(SUBWAY_MAX).toBe(12);
    expect(summonNote(9)).toBe('none');
    expect(summonNote(10)).toBe('reasonable');
    expect(summonNote(11)).toBe('reasonable');
    expect(summonNote(12)).toBe('unreasonable');
  });
});

describe('placement', () => {
  const view = { w: 1280, h: 720, top: 100, bottom: 70 };
  const size = playerSize(1280);

  it('sizes players 16:9 plus a 44px bar, smaller on phones', () => {
    expect(size).toEqual({ w: 240, h: 135 + 44 });
    expect(playerSize(390)).toEqual({ w: 160, h: 90 + 44 });
  });

  it('alternates left and right edges, keeping the middle clear, without overlap', () => {
    const rows = Math.floor((720 - 100 - 70 + 8) / (size.h + 8));
    const edge = Array.from({ length: rows * 2 }, (_, i) => slot(i, view, size));
    for (const p of edge) {
      const inMiddle = p.x + size.w > 1280 * 0.3 && p.x < 1280 * 0.7;
      expect(inMiddle).toBe(false);
      expect(p.y).toBeGreaterThanOrEqual(100);
      expect(p.y + size.h).toBeLessThanOrEqual(720 - 70);
    }
    for (let a = 0; a < edge.length; a++)
      for (let b = a + 1; b < edge.length; b++) {
        const A = edge[a] as { x: number; y: number };
        const B = edge[b] as { x: number; y: number };
        const overlap =
          A.x < B.x + size.w && B.x < A.x + size.w && A.y < B.y + size.h && B.y < A.y + size.h;
        expect(overlap).toBe(false);
      }
    expect(edge[0]?.x).toBe(8);
    expect(edge[1]?.x).toBe(1280 - 240 - 8);
  });

  it('keeps every one of twelve players on screen, even on a phone', () => {
    const phone = { w: 390, h: 844, top: 280, bottom: 80 };
    const s = playerSize(390);
    for (let i = 0; i < SUBWAY_MAX; i++) {
      const p = slot(i, phone, s);
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x + s.w).toBeLessThanOrEqual(390);
      expect(p.y + s.h).toBeLessThanOrEqual(844);
    }
  });

  it('clamps drags to the viewport and nudges by 16 or 64 px', () => {
    expect(clamp({ x: -50, y: 9999 }, { w: 800, h: 600 }, { w: 240, h: 179 })).toEqual({
      x: 0,
      y: 421,
    });
    expect(nudge('ArrowLeft', false)).toEqual({ x: -16, y: 0 });
    expect(nudge('ArrowDown', true)).toEqual({ x: 0, y: 64 });
    expect(nudge('Enter', false)).toBeNull();
  });
});

describe('embeds', () => {
  it('builds a muted, looping, privacy-enhanced embed with a staggered start', () => {
    const u = new URL(embedUrl('abc123', 2, true));
    expect(u.origin).toBe('https://www.youtube-nocookie.com');
    expect(u.pathname).toBe('/embed/abc123');
    expect(Object.fromEntries(u.searchParams)).toEqual({
      autoplay: '1',
      mute: '1',
      loop: '1',
      playlist: 'abc123',
      controls: '0',
      playsinline: '1',
      rel: '0',
      start: '90',
    });
    expect(new URL(embedUrl('abc123', 0, false)).searchParams.get('autoplay')).toBe('0');
  });

  it('round-robins over verified videos, and has none until David supplies them', () => {
    expect(videoFor(['a', 'b'], 3)).toBe('b');
    expect(videoFor([], 0)).toBeNull();
    expect(shownAll(SUBWAY_VIDEOS)).toEqual([]);
  });
});
