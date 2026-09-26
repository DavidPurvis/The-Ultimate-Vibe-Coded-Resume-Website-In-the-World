import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  active,
  clock,
  Disposer,
  isActive,
  register,
  setEnabledCheck,
  start,
  stop,
  _reset,
} from '../../src/lib/scene';

afterEach(() => _reset());

describe('Disposer', () => {
  it('runs LIFO exactly once', () => {
    const order: number[] = [];
    const d = new Disposer();
    d.add(() => order.push(1));
    d.add(() => order.push(2));
    d.run();
    d.run();
    expect(order).toEqual([2, 1]);
    expect(d.disposed).toBe(true);
  });
  it('runs late additions immediately', () => {
    const d = new Disposer();
    d.run();
    const fn = vi.fn();
    d.add(fn);
    expect(fn).toHaveBeenCalledOnce();
  });
  it('clears timers', () => {
    vi.useFakeTimers();
    const d = new Disposer();
    const t = vi.fn();
    const i = vi.fn();
    d.timeout(t, 100);
    d.interval(i, 10);
    vi.advanceTimersByTime(35);
    d.run();
    vi.advanceTimersByTime(500);
    expect(t).not.toHaveBeenCalled();
    expect(i).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
  it('rAF loop caps dt at 50ms and stops on false / dispose', () => {
    const queue: ((t: number) => void)[] = [];
    clock.raf = (cb) => {
      queue.push(cb);
      return queue.length;
    };
    clock.caf = () => {};
    const dts: number[] = [];
    const d = new Disposer();
    d.raf((_t, dt) => {
      dts.push(dt);
      return dts.length < 3;
    });
    for (const t of [0, 16, 5000, 5016]) queue.shift()?.(t);
    expect(dts).toEqual([0, 16, 50]);
    d.run();
  });
});

describe('scene registry', () => {
  it('refuses to start when disabled (Recruiter Mode)', async () => {
    register({ id: 'a', major: true, start: () => {} });
    setEnabledCheck(() => false);
    expect(await start('a')).toBe(false);
    expect(isActive('a')).toBe(false);
  });
  it('a major scene replaces another major scene', async () => {
    const disposed: string[] = [];
    register({ id: 'a', major: true, start: () => {}, dispose: (r) => disposed.push(`a:${r}`) });
    register({ id: 'b', major: true, start: () => {} });
    register({ id: 'c', major: false, start: () => {} });
    await start('a');
    await start('c');
    await start('b');
    expect(disposed).toEqual(['a:replace']);
    expect(active().sort()).toEqual(['b', 'c']);
  });
  it('stillActive() turns false after dispose (late async work is ignored)', async () => {
    let ctxRef: { stillActive(): boolean } | null = null;
    register({
      id: 'slow',
      major: false,
      start: (ctx) => {
        ctxRef = ctx;
      },
    });
    await start('slow');
    expect(ctxRef!.stillActive()).toBe(true);
    stop('slow', 'mode');
    expect(ctxRef!.stillActive()).toBe(false);
  });
  it('a throwing start is disposed as an error', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    register({
      id: 'bad',
      major: false,
      start: () => {
        throw new Error('boom');
      },
    });
    expect(await start('bad')).toBe(false);
    expect(isActive('bad')).toBe(false);
    spy.mockRestore();
  });
});
