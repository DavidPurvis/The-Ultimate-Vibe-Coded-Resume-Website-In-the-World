/**
 * Scene lifecycle: every gag allocates through a Disposer, so switching to Recruiter Mode (or
 * leaving the page) tears everything down deterministically. Only one "major" set piece at a time.
 */

export type DisposeReason = 'mode' | 'navigate' | 'replace' | 'complete' | 'error';

type RafFn = (cb: (t: number) => void) => number;
type CafFn = (id: number) => void;

/** Test seams for timers/rAF. */
export const clock = {
  raf: ((cb: (t: number) => void) => globalThis.requestAnimationFrame(cb)) as RafFn,
  caf: ((id: number) => globalThis.cancelAnimationFrame(id)) as CafFn,
};

/** Centralized cleanup. Everything a scene allocates goes through here; run() is LIFO + idempotent. */
export class Disposer {
  private fns: (() => void)[] = [];
  private done = false;

  get disposed(): boolean {
    return this.done;
  }
  add(fn: () => void): void {
    if (this.done) {
      fn();
      return;
    }
    this.fns.push(fn);
  }
  on(
    target: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject,
    opts?: AddEventListenerOptions | boolean,
  ): void {
    target.addEventListener(type, fn, opts);
    this.add(() => target.removeEventListener(type, fn, opts));
  }
  timeout(fn: () => void, ms: number): void {
    const id = setTimeout(fn, ms);
    this.add(() => clearTimeout(id));
  }
  interval(fn: () => void, ms: number): void {
    const id = setInterval(fn, ms);
    this.add(() => clearInterval(id));
  }
  /** rAF loop; `loop` returns false to stop. dt (ms) is capped at 50 to survive tab suspension. */
  raf(loop: (t: number, dt: number) => boolean): void {
    let last: number | null = null;
    let id = 0;
    let stopped = false;
    const tick = (t: number) => {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min(50, t - last);
      last = t;
      if (loop(t, dt) === false) {
        stopped = true;
        return;
      }
      id = clock.raf(tick);
    };
    id = clock.raf(tick);
    this.add(() => {
      stopped = true;
      clock.caf(id);
    });
  }
  observe(o: { disconnect(): void }): void {
    this.add(() => o.disconnect());
  }
  animation(a: { cancel(): void }): void {
    this.add(() => a.cancel());
  }
  run(): void {
    if (this.done) return;
    this.done = true;
    const fns = this.fns.splice(0).reverse();
    for (const fn of fns) {
      try {
        fn();
      } catch (e) {
        console.error(e);
      }
    }
  }
}

export interface SceneCtx {
  d: Disposer;
  signal: AbortSignal;
  stillActive(): boolean;
}

export interface Scene {
  id: string;
  major: boolean;
  start(ctx: SceneCtx): void | Promise<void>;
  /** Optional hook; the Disposer runs automatically after it. */
  dispose?(reason: DisposeReason): void;
}

interface Running {
  scene: Scene;
  d: Disposer;
  ac: AbortController;
}

const registry = new Map<string, Scene>();
const running = new Map<string, Running>();
let enabledCheck: () => boolean = () => true;

/** mode.ts installs this so scenes refuse to start in Recruiter Mode. */
export function setEnabledCheck(fn: () => boolean): void {
  enabledCheck = fn;
}

export function register(scene: Scene): void {
  registry.set(scene.id, scene);
}

export function isActive(id: string): boolean {
  return running.has(id);
}
export function active(): string[] {
  return [...running.keys()];
}

export function stop(id: string, reason: DisposeReason): void {
  const r = running.get(id);
  if (!r) return;
  running.delete(id);
  r.ac.abort();
  try {
    r.scene.dispose?.(reason);
  } finally {
    r.d.run();
  }
}

export async function start(id: string): Promise<boolean> {
  const scene = registry.get(id);
  if (!scene || !enabledCheck()) return false;
  if (running.has(id)) return true;
  if (scene.major) {
    for (const [otherId, r] of running) if (r.scene.major) stop(otherId, 'replace');
  }
  const d = new Disposer();
  const ac = new AbortController();
  const entry: Running = { scene, d, ac };
  running.set(id, entry);
  const ctx: SceneCtx = { d, signal: ac.signal, stillActive: () => running.get(id) === entry };
  try {
    await scene.start(ctx);
  } catch (e) {
    console.error(e);
    stop(id, 'error');
    return false;
  }
  return true;
}

export function disposeAll(reason: DisposeReason): void {
  for (const id of [...running.keys()]) stop(id, reason);
}

/** Test seam. */
export function _reset(): void {
  disposeAll('navigate');
  registry.clear();
  enabledCheck = () => true;
}
