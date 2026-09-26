/** Overkill HUD: the arithmetic behind the decoration. Pure and unit-tested. */

/** Player level: one level per threat point, starting at 1. */
export function playerLevel(threat: number): number {
  return 1 + Math.max(0, Math.floor(threat));
}

/** Scroll progress through the page, 0–100 (a page that fits the window counts as read). */
export function xpPercent(scrollY: number, scrollHeight: number, viewport: number): number {
  const max = scrollHeight - viewport;
  if (max <= 0) return 100;
  return Math.round(Math.min(1, Math.max(0, scrollY / max)) * 100);
}

const DIRS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const;

/** Compass heading from the scroll position: a full turn every 1,440 px. */
export function compass(scrollY: number): { deg: number; dir: (typeof DIRS)[number] } {
  const deg = Math.round((((scrollY / 4) % 360) + 360) % 360) % 360;
  return { deg, dir: DIRS[Math.round(deg / 45) % 8] ?? 'N' };
}

export interface Block {
  top: number;
  height: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Minimap: page blocks (document coordinates) → canvas rectangles, plus the viewport marker.
 * Every block gets at least 1px so nothing disappears on long pages.
 */
export function minimap(
  blocks: readonly Block[],
  page: { height: number; scrollY: number; viewport: number },
  canvas: { w: number; h: number; pad: number },
): { blocks: Rect[]; view: Rect } {
  const scale = (canvas.h - canvas.pad * 2) / Math.max(1, page.height);
  const w = canvas.w - canvas.pad * 2;
  const rect = (top: number, height: number): Rect => ({
    x: canvas.pad,
    y: canvas.pad + top * scale,
    w,
    h: Math.max(1, height * scale),
  });
  return {
    blocks: blocks.map((b) => rect(b.top, b.height)),
    view: rect(page.scrollY, Math.min(page.viewport, page.height)),
  };
}

/** Where a click on the minimap should scroll to (centres the viewport on that point). */
export function minimapTarget(
  y: number,
  page: { height: number; viewport: number },
  canvas: { h: number; pad: number },
): number {
  const frac = Math.min(1, Math.max(0, (y - canvas.pad) / (canvas.h - canvas.pad * 2)));
  const target = frac * page.height - page.viewport / 2;
  return Math.round(Math.min(page.height - page.viewport, Math.max(0, target)));
}

/** Deterministic chat: `n` [handle, line] pairs, never the same line twice in a row. */
export function chatSchedule(
  rng: () => number,
  handles: readonly string[],
  lines: readonly string[],
  n: number,
): [string, string][] {
  const out: [string, string][] = [];
  let prev = -1;
  for (let i = 0; i < n; i++) {
    let li = Math.floor(rng() * lines.length);
    if (li === prev && lines.length > 1) li = (li + 1) % lines.length;
    prev = li;
    const h = handles[Math.floor(rng() * handles.length)] ?? '';
    out.push([h, lines[li] ?? '']);
  }
  return out;
}

/** Frames per second from recent frame durations (ms), smoothed; 0 before the first frame. */
export function fps(frameTimes: readonly number[]): number {
  const valid = frameTimes.filter((t) => t > 0);
  if (!valid.length) return 0;
  const avg = valid.reduce((a, b) => a + b, 0) / valid.length;
  return Math.min(999, Math.round(1000 / avg));
}

/** A drain-and-refill meter: `value` (0–100) after `dtMs`, draining `perSec` points a second. */
export function drain(value: number, dtMs: number, perSec: number): number {
  return Math.min(100, Math.max(0, value - (perSec * dtMs) / 1000));
}

/** Hotbar slot labels: 1, 2, 3… skipping every number containing a 7. */
export function slotNumbers(count: number): number[] {
  const out: number[] = [];
  for (let n = 1; out.length < count; n++) if (!String(n).includes('7')) out.push(n);
  return out;
}

/** Keep the newest `max` items (feeds, chat). */
export function pushCapped<T>(list: readonly T[], item: T, max: number): T[] {
  return [...list, item].slice(-max);
}
