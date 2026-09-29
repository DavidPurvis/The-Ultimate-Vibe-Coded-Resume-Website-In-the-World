/**
 * The scene registry. Every procedure allocates through a Disposer (a Scope: listeners, timers,
 * frames, observers, animations and nodes are released together), and only one "major" scene
 * (a dialog-sized procedure) runs at a time: starting one disposes the one before.
 *
 * Lazily imported scenes go through request(): if the visitor closed, navigated, switched to
 * Direct access or asked for something else while the chunk was loading, the late import is
 * dropped instead of opening a dialog nobody asked for.
 */
import { Scope } from '../runtime/lifecycle';

export type DisposeReason = 'mode' | 'navigate' | 'replace' | 'complete' | 'error';

/** A Scope with the names the scenes were written against. */
export class Disposer extends Scope {
  run(): void {
    this.dispose();
  }
  animation(a: { cancel(): void }): void {
    this.animate(a);
  }
}

export interface SceneCtx {
  d: Disposer;
  signal: AbortSignal;
  /** False once this run was stopped or replaced: check after every await before touching the DOM. */
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
}

const registry = new Map<string, Scene>();
const running = new Map<string, Running>();
const pending = new Map<string, number>();
let generation = 0;
let enabledCheck: () => boolean = () => true;

/** mode.ts installs this so scenes refuse to start under Direct access. */
export function setEnabledCheck(fn: () => boolean): void {
  enabledCheck = fn;
}

export function register(scene: Scene): void {
  registry.set(scene.id, scene);
}

export const isActive = (id: string): boolean => running.has(id);
export const active = (): string[] => [...running.keys()];
export const majorActive = (): boolean => [...running.values()].some((r) => r.scene.major);

export function stop(id: string, reason: DisposeReason): void {
  pending.delete(id);
  const r = running.get(id);
  if (!r) return;
  running.delete(id);
  try {
    r.scene.dispose?.(reason);
  } catch (e) {
    console.error(e);
  } finally {
    r.d.run();
  }
}

export async function start(id: string): Promise<boolean> {
  const scene = registry.get(id);
  if (!scene || !enabledCheck()) return false;
  if (running.has(id)) return true;
  if (scene.major) for (const [other, r] of running) if (r.scene.major) stop(other, 'replace');
  const d = new Disposer();
  const entry: Running = { scene, d };
  running.set(id, entry);
  const ctx: SceneCtx = { d, signal: d.signal, stillActive: () => running.get(id) === entry };
  try {
    await scene.start(ctx);
  } catch (e) {
    console.error(e);
    stop(id, 'error');
    return false;
  }
  return true;
}

/**
 * Load a scene's chunk, then start it, unless the request went stale meanwhile: a newer request
 * for the same scene, stop()/disposeAll(), Direct access, or `stillWanted()` returning false.
 * Resolves false (and starts nothing) when stale or when the import fails.
 */
export async function request(
  id: string,
  load: () => Promise<unknown>,
  stillWanted: () => boolean = () => true,
): Promise<boolean> {
  if (!enabledCheck()) return false;
  const mine = ++generation;
  pending.set(id, mine);
  try {
    await load();
  } catch (e) {
    if (pending.get(id) === mine) pending.delete(id);
    console.error(e);
    return false;
  }
  if (pending.get(id) !== mine || !enabledCheck() || !stillWanted()) return false;
  pending.delete(id);
  return start(id);
}

/** Stop everything and invalidate every pending request. */
export function disposeAll(reason: DisposeReason): void {
  pending.clear();
  for (const id of [...running.keys()]) stop(id, reason);
}

/** Test seam. */
export function _reset(): void {
  disposeAll('navigate');
  registry.clear();
  enabledCheck = () => true;
}
