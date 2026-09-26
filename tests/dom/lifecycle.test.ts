// @vitest-environment happy-dom
/** The lifecycle contract: disposing a Scope releases everything it owns (plan §L). */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { isAbort, mountPage, Scope } from '../../src/runtime/lifecycle';

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('Scope', () => {
  it('runs cleanups last-in first-out, exactly once', () => {
    const order: number[] = [];
    const s = new Scope();
    s.add(() => order.push(1));
    s.add(() => order.push(2));
    s.dispose();
    s.dispose();
    expect(order).toEqual([2, 1]);
    expect(s.disposed).toBe(true);
  });

  it('runs late additions immediately and ignores late listeners and timers', () => {
    const s = new Scope();
    s.dispose();
    const fn = vi.fn();
    s.add(fn);
    expect(fn).toHaveBeenCalledOnce();
    const el = document.createElement('button');
    const click = vi.fn();
    s.on(el, 'click', click);
    el.click();
    expect(click).not.toHaveBeenCalled();
  });

  it('removes its listeners through the abort signal', () => {
    const s = new Scope();
    const el = document.createElement('button');
    const click = vi.fn();
    s.on(el, 'click', click);
    el.click();
    s.dispose();
    el.click();
    expect(click).toHaveBeenCalledOnce();
  });

  it('clears timeouts and intervals', () => {
    vi.useFakeTimers();
    const s = new Scope();
    const t = vi.fn();
    const i = vi.fn();
    s.timeout(t, 100);
    s.interval(i, 10);
    vi.advanceTimersByTime(25);
    expect(i).toHaveBeenCalledTimes(2);
    s.dispose();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(t).not.toHaveBeenCalled();
    expect(i).toHaveBeenCalledTimes(2);
  });

  it('runs a rAF loop with dt capped at 50 ms, and stops it on dispose', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    const s = new Scope();
    const dts: number[] = [];
    s.raf((_, dt) => {
      dts.push(dt);
      return true;
    });
    vi.advanceTimersByTime(16 * 5);
    s.dispose();
    const n = dts.length;
    vi.advanceTimersByTime(200);
    expect(dts.length).toBe(n);
    expect(dts[0]).toBe(0);
    expect(dts.every((d) => d <= 50)).toBe(true);
  });

  it('disconnects observers, cancels animations, removes nodes and blanks frames', () => {
    const s = new Scope();
    const observer = { disconnect: vi.fn() };
    const animation = { cancel: vi.fn() };
    const node = s.node(document.body.appendChild(document.createElement('div')));
    const frame = document.body.appendChild(document.createElement('iframe'));
    s.observe(observer);
    s.animate(animation);
    s.frame(frame);
    s.dispose();
    expect(observer.disconnect).toHaveBeenCalledOnce();
    expect(animation.cancel).toHaveBeenCalledOnce();
    expect(node.isConnected).toBe(false);
    expect(frame.isConnected).toBe(false);
  });

  it('delay resolves on time and rejects with an AbortError when disposed first', async () => {
    vi.useFakeTimers();
    const s = new Scope();
    const ok = s.delay(50);
    vi.advanceTimersByTime(50);
    await expect(ok).resolves.toBeUndefined();
    const cut = s.delay(50);
    s.dispose();
    await cut.then(
      () => expect.unreachable(),
      (e: unknown) => expect(isAbort(e)).toBe(true),
    );
    await s.delay(1).then(
      () => expect.unreachable(),
      (e: unknown) => expect(isAbort(e)).toBe(true),
    );
  });

  it('disposes children with the parent; a child of a disposed parent starts disposed', () => {
    const parent = new Scope();
    const child = parent.child();
    const fn = vi.fn();
    child.add(fn);
    parent.dispose();
    expect(child.disposed).toBe(true);
    expect(fn).toHaveBeenCalledOnce();
    expect(parent.child().disposed).toBe(true);
  });

  it('a throwing cleanup does not stop the others', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const s = new Scope();
    const after = vi.fn();
    s.add(after);
    s.add(() => {
      throw new Error('boom');
    });
    s.dispose();
    expect(after).toHaveBeenCalledOnce();
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});

describe('mountPage', () => {
  it('mounts, and disposes on a real unload but not on a bfcache pagehide', async () => {
    const cleanup = vi.fn();
    const scope = mountPage(({ scope: s }) => s.add(cleanup));
    await Promise.resolve();
    await Promise.resolve();
    window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: true }));
    expect(scope.disposed).toBe(false);
    window.dispatchEvent(Object.assign(new Event('pagehide'), { persisted: false }));
    expect(scope.disposed).toBe(true);
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
