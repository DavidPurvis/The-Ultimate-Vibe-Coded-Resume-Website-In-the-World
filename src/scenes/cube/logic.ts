/**
 * The Tungsten Cube Experience: the physics that doesn't need a GPU. Pure and unit-tested.
 * Cube rain is simple kinematics with a height map, so thousands of cubes settle into a pile in
 * O(n) per frame without a physics engine.
 */

/** Tungsten, g/cm³. */
export const DENSITY = 19.3;
/** The wishlist cube: 4 inches on a side. */
export const EDGE_CM = 4 * 2.54;

export function massKg(edgeCm = EDGE_CM, density = DENSITY): number {
  return (edgeCm ** 3 * density) / 1000;
}
export const kgToLb = (kg: number): number => kg * 2.20462;

/** Camera shake after a heft: a decaying wobble, zero after `duration` seconds. */
export function shake(t: number, amplitude = 0.12, duration = 0.6): { x: number; y: number } {
  if (t < 0 || t >= duration) return { x: 0, y: 0 };
  const k = amplitude * (1 - t / duration) ** 2;
  return { x: k * Math.sin(t * 71), y: k * Math.cos(t * 53) };
}

export interface Rain {
  /** Instances in use. */
  count: number;
  /** x, y, z per instance. */
  pos: Float32Array;
  /** Vertical velocity per instance. */
  vy: Float32Array;
  /** 1 once an instance has come to rest on the pile. */
  resting: Uint8Array;
  /** Pile height per floor cell. */
  heights: Float32Array;
  size: number;
  /** Half-width of the square floor area the pile may cover. */
  extent: number;
  cells: number;
}

export function createRain(capacity: number, size = 0.18, extent = 4.5, cells = 64): Rain {
  return {
    count: 0,
    pos: new Float32Array(capacity * 3),
    vy: new Float32Array(capacity),
    resting: new Uint8Array(capacity),
    heights: new Float32Array(cells * cells),
    size,
    extent,
    cells,
  };
}

/** Floor cell for a point (clamped to the pile area). */
export function cellOf(r: Rain, x: number, z: number): number {
  const u = Math.floor(((x + r.extent) / (2 * r.extent)) * r.cells);
  const v = Math.floor(((z + r.extent) / (2 * r.extent)) * r.cells);
  const cu = Math.min(r.cells - 1, Math.max(0, u));
  const cv = Math.min(r.cells - 1, Math.max(0, v));
  return cv * r.cells + cu;
}

/** Raise the floor under a solid block (the big cube) so the rain lands on top of it. */
export function platform(r: Rain, half: number, height: number): void {
  for (let c = 0; c < r.heights.length; c++) {
    const { x, z } = cellCenter(r, c);
    if (Math.abs(x) <= half && Math.abs(z) <= half)
      r.heights[c] = Math.max(r.heights[c] ?? 0, height);
  }
}

/** Centre of a floor cell, in world units. */
export function cellCenter(r: Rain, c: number): { x: number; z: number } {
  const w = (2 * r.extent) / r.cells;
  return {
    x: -r.extent + ((c % r.cells) + 0.5) * w,
    z: -r.extent + (Math.floor(c / r.cells) + 0.5) * w,
  };
}

/** Steepest step (in cube sizes) a pile keeps between neighbouring cells. */
export const REPOSE = 0.6;

/** Angle of repose: roll downhill to the lowest neighbouring cell while the drop exceeds a cube. */
export function roll(r: Rain, c: number): number {
  for (let hop = 0; hop < 16; hop++) {
    const u = c % r.cells;
    const v = Math.floor(c / r.cells);
    let best = c;
    for (const [du, dv] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ] as const) {
      const nu = u + du;
      const nv = v + dv;
      if (nu < 0 || nv < 0 || nu >= r.cells || nv >= r.cells) continue;
      const n = nv * r.cells + nu;
      if ((r.heights[n] ?? 0) < (r.heights[best] ?? 0)) best = n;
    }
    if (best === c || (r.heights[c] ?? 0) - (r.heights[best] ?? 0) <= r.size * REPOSE) return c;
    c = best;
  }
  return c;
}

/** Put cube `i` to rest on cell `c` (after rolling), raising the pile there. */
function rest(r: Rain, i: number, c: number): void {
  const to = roll(r, c);
  const { x, z } = cellCenter(r, to);
  r.pos[i * 3] = x;
  r.pos[i * 3 + 1] = (r.heights[to] ?? 0) + r.size / 2;
  r.pos[i * 3 + 2] = z;
  r.vy[i] = 0;
  r.resting[i] = 1;
  r.heights[to] = (r.heights[to] ?? 0) + r.size;
}

/**
 * Add `n` cubes above the pile, spread over a disc so they land in a mound. Returns how many
 * were actually added (capacity is the limit).
 */
export function summon(r: Rain, n: number, rng: () => number, from = 6, spread = 5): number {
  const capacity = r.vy.length;
  const add = Math.max(0, Math.min(n, capacity - r.count));
  for (let k = 0; k < add; k++) {
    const i = r.count + k;
    // Denser toward the middle: sqrt-less radius makes a natural heap.
    const a = rng() * Math.PI * 2;
    const rad = rng() * rng() * r.extent * 0.9;
    r.pos[i * 3] = Math.cos(a) * rad;
    r.pos[i * 3 + 1] = from + rng() * spread;
    r.pos[i * 3 + 2] = Math.sin(a) * rad;
    r.vy[i] = -rng() * 2;
    r.resting[i] = 0;
  }
  r.count += add;
  return add;
}

const G = 9.8;
const RESTITUTION = 0.28;

/**
 * Advance falling cubes by `dt` seconds. A cube that reaches the pile under it bounces while it's
 * fast, then rests on top and raises that cell. Returns how many are still falling.
 */
export function step(r: Rain, dt: number): number {
  let falling = 0;
  const half = r.size / 2;
  for (let i = 0; i < r.count; i++) {
    if (r.resting[i]) continue;
    const vy = (r.vy[i] ?? 0) - G * dt;
    let y = (r.pos[i * 3 + 1] ?? 0) + vy * dt;
    const c = cellOf(r, r.pos[i * 3] ?? 0, r.pos[i * 3 + 2] ?? 0);
    const ground = (r.heights[c] ?? 0) + half;
    if (y <= ground) {
      y = ground;
      if (-vy * RESTITUTION > 1.2) {
        r.vy[i] = -vy * RESTITUTION;
        r.pos[i * 3 + 1] = y;
        falling++;
      } else rest(r, i, c);
    } else {
      r.vy[i] = vy;
      r.pos[i * 3 + 1] = y;
      falling++;
    }
  }
  return falling;
}

/** Reduced motion: every falling cube drops straight onto the pile at once. */
export function settle(r: Rain): void {
  for (let i = 0; i < r.count; i++)
    if (!r.resting[i]) rest(r, i, cellOf(r, r.pos[i * 3] ?? 0, r.pos[i * 3 + 2] ?? 0));
}

/** Tallest point of the pile. */
export const pileHeight = (r: Rain): number => r.heights.reduce((m, h) => Math.max(m, h), 0);
