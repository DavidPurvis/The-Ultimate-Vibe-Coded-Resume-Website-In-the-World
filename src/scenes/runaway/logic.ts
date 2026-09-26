/** Pure geometry for evasive controls (tested without a DOM). */
export interface Pt {
  x: number;
  y: number;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const center = (r: Rect): Pt => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
export const dist = (a: Pt, b: Pt): number => Math.hypot(a.x - b.x, a.y - b.y);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Where should the button's top-left go? Move `distance` px away from the pointer along the
 * pointer→center vector, clamp inside the arena (minus padding); if still cornered within
 * `radius`, jump to the arena corner farthest from the pointer.
 */
export function nextPosition(
  btn: Rect,
  pointer: Pt,
  arena: Rect,
  distance: number,
  radius: number,
  pad = 8,
): Pt {
  const c = center(btn);
  let vx = c.x - pointer.x;
  let vy = c.y - pointer.y;
  const len = Math.hypot(vx, vy);
  if (len < 1e-6) {
    vx = 1;
    vy = 0;
  } else {
    vx /= len;
    vy /= len;
  }
  const minX = arena.x + pad;
  const minY = arena.y + pad;
  const maxX = Math.max(minX, arena.x + arena.w - btn.w - pad);
  const maxY = Math.max(minY, arena.y + arena.h - btn.h - pad);
  let x = clamp(c.x + vx * distance - btn.w / 2, minX, maxX);
  let y = clamp(c.y + vy * distance - btn.h / 2, minY, maxY);
  if (dist({ x: x + btn.w / 2, y: y + btn.h / 2 }, pointer) < radius) {
    const corners: Pt[] = [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: minX, y: maxY },
      { x: maxX, y: maxY },
    ];
    let best = corners[0] as Pt;
    let bestD = -1;
    for (const k of corners) {
      const d = dist({ x: k.x + btn.w / 2, y: k.y + btn.h / 2 }, pointer);
      if (d > bestD) {
        bestD = d;
        best = k;
      }
    }
    x = best.x;
    y = best.y;
  }
  return { x, y };
}

/**
 * One approach = one dodge: dodge only on the transition into the zone, and only after the
 * cooldown has elapsed since the previous dodge.
 */
export function shouldDodge(
  wasInZone: boolean,
  inZone: boolean,
  lastDodgeAt: number,
  now: number,
  cooldownMs: number,
): boolean {
  return inZone && !wasInZone && now - lastDodgeAt >= cooldownMs;
}
