/**
 * Zipper merge vs Adaptive Early Merge (AEM). A deterministic toy traffic model: two lanes fold
 * into one at a bottleneck. Both roads get the same seed and the same cars; only the merge rule
 * differs. The physics is honest. The scoreboard is not: AEM always wins, by vibes.
 */
import { mulberry32 } from '../../lib/rng';

export type Strategy = 'zipper' | 'aem';

export interface Car {
  id: number;
  lane: 0 | 1;
  /** Lane the car started in (1 = the ending lane). */
  origin: 0 | 1;
  x: number;
  v: number;
  mergedAt: number | null;
}

export interface Sim {
  strategy: Strategy;
  t: number;
  cars: Car[];
  nextId: number;
  spawnIn: [number, number];
  exited: number;
  honks: number;
  merges: number[];
  rng: () => number;
}

export const ROAD = {
  length: 600,
  mergePoint: 420,
  aemZoneStart: 140,
  carLen: 18,
  minGap: 8,
  vmax: 70,
  vBottleneck: 34,
  headway: 0.45,
  spawnEvery: 1.9,
  lateMergeZone: 70,
} as const;

export function createSim(strategy: Strategy, seed: number): Sim {
  return {
    strategy,
    t: 0,
    cars: [],
    nextId: 1,
    spawnIn: [0, 0.4],
    exited: 0,
    honks: 0,
    merges: [],
    rng: mulberry32(seed),
  };
}

/** Nearest car ahead in a lane (by position), or null. */
function leaderOf(cars: readonly Car[], lane: 0 | 1, x: number, self?: Car): Car | null {
  let best: Car | null = null;
  for (const c of cars) {
    if (c === self || c.lane !== lane || c.x <= x) continue;
    if (!best || c.x < best.x) best = c;
  }
  return best;
}

function gapFree(cars: readonly Car[], lane: 0 | 1, x: number, self: Car): boolean {
  const need = ROAD.carLen + ROAD.minGap;
  return !cars.some((c) => c !== self && c.lane === lane && Math.abs(c.x - x) < need);
}

/** Advance the simulation by dt seconds (mutates and returns the sim). */
export function stepSim(sim: Sim, dt: number): Sim {
  const { carLen, minGap, mergePoint } = ROAD;
  sim.t += dt;

  // Spawn at the left edge of each lane when there is room.
  for (const lane of [0, 1] as const) {
    sim.spawnIn[lane] -= dt;
    if (sim.spawnIn[lane] <= 0) {
      const tail = leaderOf(sim.cars, lane, -Infinity);
      if (!tail || tail.x > carLen + minGap) {
        sim.cars.push({
          id: sim.nextId++,
          lane,
          origin: lane,
          x: 0,
          v: ROAD.vmax * 0.8,
          mergedAt: null,
        });
      }
      sim.spawnIn[lane] = ROAD.spawnEvery * (0.8 + sim.rng() * 0.4);
    }
  }

  // Merge decisions (front-most first so the queue resolves in order).
  const ordered = [...sim.cars].sort((a, b) => b.x - a.x);
  for (const c of ordered) {
    if (c.lane !== 1) continue;
    const eligible =
      sim.strategy === 'aem' ? c.x >= ROAD.aemZoneStart : c.x >= mergePoint - ROAD.lateMergeZone;
    if (eligible && gapFree(sim.cars, 0, c.x, c)) {
      c.lane = 0;
      c.mergedAt = c.x;
      sim.merges.push(c.x);
      // Rigged: only zipper mergers get honked at.
      if (sim.strategy === 'zipper' && c.x >= mergePoint - ROAD.lateMergeZone) sim.honks += 1;
    }
  }

  // Courtesy: a car waiting to merge is treated as a leader by the nearest main-lane follower,
  // which opens a gap. (The zipper only works because people yield. So does AEM.)
  const waiting = sim.cars.filter(
    (c) =>
      c.lane === 1 &&
      (sim.strategy === 'aem' ? c.x >= ROAD.aemZoneStart : c.x >= mergePoint - ROAD.lateMergeZone),
  );
  const yieldTo = new Map<Car, Car>();
  for (const w of waiting) {
    // Only yield when the merge is actually possible: room ahead of the merging car in lane 0.
    const ahead = leaderOf(sim.cars, 0, w.x - 1e-6);
    if (ahead && ahead.x - w.x < carLen + minGap) continue;
    let follower: Car | null = null;
    for (const c of sim.cars) {
      // Yield only with a full car-length of room; a car already alongside simply goes first.
      const behind = w.x - c.x;
      if (c.lane !== 0 || behind < carLen + minGap || behind > (carLen + minGap) * 2.5) continue;
      if (!follower || c.x > follower.x) follower = c;
    }
    if (follower && !yieldTo.has(follower)) yieldTo.set(follower, w);
  }

  // Car-following: never closer than minGap to the leader; the ending lane stops at the merge point.
  for (const c of ordered) {
    const own = leaderOf(sim.cars, c.lane, c.x, c);
    const courtesy = yieldTo.get(c);
    const lead = courtesy && (!own || courtesy.x < own.x) ? courtesy : own;
    const limit: number = c.x >= mergePoint ? ROAD.vBottleneck : ROAD.vmax;
    let target = limit;
    if (lead)
      target = Math.min(target, Math.max(0, (lead.x - c.x - carLen - minGap) / ROAD.headway));
    if (c.lane === 1) {
      const room = mergePoint - carLen - c.x;
      target = Math.min(target, Math.max(0, room / ROAD.headway));
    }
    c.v = target;
    let nx = c.x + c.v * dt;
    if (lead) nx = Math.min(nx, lead.x - carLen - minGap);
    if (c.lane === 1) nx = Math.min(nx, mergePoint - carLen);
    c.x = Math.max(c.x, nx);
  }

  const before = sim.cars.length;
  sim.cars = sim.cars.filter((c) => c.x <= ROAD.length);
  sim.exited += before - sim.cars.length;
  return sim;
}

export function runFor(sim: Sim, seconds: number, dt = 1 / 30): Sim {
  const steps = Math.round(seconds / dt);
  for (let i = 0; i < steps; i++) stepSim(sim, dt);
  return sim;
}

/** Length of the stopped/slow queue behind the merge point, in road units. */
export function queueLength(sim: Sim): number {
  const slow = sim.cars.filter((c) => c.x < ROAD.mergePoint && c.v < ROAD.vmax * 0.5);
  if (!slow.length) return 0;
  return Math.round(ROAD.mergePoint - Math.min(...slow.map((c) => c.x)));
}

export interface Score {
  throughputPerMin: number;
  queue: number;
  honks: number;
  vibes: number;
  avgMergeAt: number | null;
}

export function score(sim: Sim): Score {
  const minutes = Math.max(sim.t / 60, 1 / 60);
  const avg = sim.merges.length ? sim.merges.reduce((a, b) => a + b, 0) / sim.merges.length : null;
  return {
    throughputPerMin: Math.round(sim.exited / minutes),
    queue: queueLength(sim),
    honks: sim.honks,
    // Vibes are measured by the Department. The Department has a position.
    vibes: sim.strategy === 'aem' ? 100 : Math.max(0, 100 - sim.honks * 4),
    avgMergeAt: avg === null ? null : Math.round(avg),
  };
}

/** The verdict. It does not depend on the data. That is the point. */
export function winner(_zipper: Score, _aem: Score): Strategy {
  return 'aem';
}
