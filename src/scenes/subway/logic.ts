/** Attention-Span Mode: the reducer, the summon labels, player placement and embed URLs. Pure. */
import { SUBWAY_MAX, type SubwayState } from '../../lib/storage';

export { SUBWAY_MAX };
/** The Department considers ten players a reasonable amount. */
export const REASONABLE = 10;

export type SubwayAction =
  | { type: 'on' }
  | { type: 'off' }
  | { type: 'summon' }
  | { type: 'dismiss' }
  | { type: 'dismissAll' };

export function subwayReducer(s: SubwayState, a: SubwayAction): SubwayState {
  switch (a.type) {
    case 'on':
      return { on: true, count: s.count };
    case 'off':
      return { on: false, count: 0 };
    case 'summon':
      return s.on && s.count < SUBWAY_MAX ? { ...s, count: s.count + 1 } : s;
    case 'dismiss':
      return { ...s, count: Math.max(0, s.count - 1) };
    case 'dismissAll':
      return { ...s, count: 0 };
  }
}

/** Which note the summon button carries at this count. */
export function summonNote(count: number): 'none' | 'reasonable' | 'unreasonable' {
  if (count >= SUBWAY_MAX) return 'unreasonable';
  if (count >= REASONABLE) return 'reasonable';
  return 'none';
}

export interface Box {
  w: number;
  h: number;
}
export interface Pos {
  x: number;
  y: number;
}

/** Player size: 16:9 video plus a 44px control bar; smaller on narrow screens. */
export function playerSize(viewportW: number): Box {
  const w = viewportW < 600 ? 160 : 240;
  return { w, h: Math.round((w * 9) / 16) + 44 };
}

/**
 * Where player `i` goes: down the left edge and the right edge alternately (the middle stays
 * clear), between `top` and `bottom` insets. Once the edges are full, later players stack on the
 * edges with a small inward cascade, which is what the Department deserves.
 */
export function slot(
  i: number,
  view: { w: number; h: number; top: number; bottom: number },
  size: Box,
  gap = 8,
): Pos {
  const usable = Math.max(size.h, view.h - view.top - view.bottom);
  const rows = Math.max(1, Math.floor((usable + gap) / (size.h + gap)));
  const perRound = rows * 2;
  const round = Math.floor(i / perRound);
  const k = i % perRound;
  const side = k % 2; // 0 = left, 1 = right
  const row = Math.floor(k / 2);
  const inset = gap + round * 24;
  const x = side === 0 ? inset : view.w - size.w - inset;
  const y = view.top + gap + row * (size.h + gap) + round * 24;
  return clamp({ x, y }, view, size);
}

/** Keep a player fully on screen (used for slots, drags and arrow keys). */
export function clamp(p: Pos, view: { w: number; h: number }, size: Box): Pos {
  return {
    x: Math.round(Math.min(Math.max(0, view.w - size.w), Math.max(0, p.x))),
    y: Math.round(Math.min(Math.max(0, view.h - size.h), Math.max(0, p.y))),
  };
}

/** Arrow-key nudge for a focused drag handle: 16px, or 64px with Shift. */
export function nudge(key: string, shift: boolean): Pos | null {
  const d = shift ? 64 : 16;
  const moves: Record<string, Pos> = {
    ArrowLeft: { x: -d, y: 0 },
    ArrowRight: { x: d, y: 0 },
    ArrowUp: { x: 0, y: -d },
    ArrowDown: { x: 0, y: d },
  };
  return moves[key] ?? null;
}

/**
 * The privacy-enhanced embed: muted, looping, no controls, each player starting at a different
 * point so twelve of them aren't synchronised. Reduced motion never autoplays.
 */
export function embedUrl(id: string, index: number, autoplay: boolean): string {
  const q = new URLSearchParams({
    autoplay: autoplay ? '1' : '0',
    mute: '1',
    loop: '1',
    playlist: id,
    controls: '0',
    playsinline: '1',
    rel: '0',
    start: String((index * 45) % 600),
  });
  return `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}?${q.toString()}`;
}

/** Which video player `i` shows (round-robin over the verified IDs). */
export const videoFor = (ids: readonly string[], i: number): string | null =>
  ids.length ? (ids[i % ids.length] ?? null) : null;
