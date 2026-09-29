// @vitest-environment happy-dom
/**
 * The scene registry's cancellation contract: one major scene at a time, replacement disposes
 * the previous one, and a late import never starts a scene nobody wants any more.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  _reset,
  active,
  disposeAll,
  isActive,
  majorActive,
  register,
  request,
  setEnabledCheck,
  start,
  stop,
  type SceneCtx,
} from '../../src/lib/scene';

function deferred() {
  let resolve!: () => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** A scene that owns a timer, a listener, a node and an animation, and reports its disposal. */
function scene(id: string, major: boolean, log: string[]) {
  let ctx: SceneCtx | null = null;
  register({
    id,
    major,
    start(c) {
      ctx = c;
      log.push(`start ${id}`);
      c.d.timeout(() => log.push(`timer ${id}`), 1000);
      c.d.on(document, 'keydown', () => log.push(`key ${id}`));
      c.d.node(document.body.appendChild(document.createElement('div'))).id = id;
      c.d.animation({ cancel: () => log.push(`anim ${id}`) });
    },
    dispose: (reason) => log.push(`dispose ${id} ${reason}`),
  });
  return () => ctx;
}

let log: string[];
beforeEach(() => {
  vi.useFakeTimers();
  log = [];
  document.body.innerHTML = '';
});
afterEach(() => {
  _reset();
  vi.useRealTimers();
});

describe('major scenes', () => {
  it('starting a major scene disposes the previous one completely', async () => {
    scene('cookies', true, log);
    scene('release', true, log);
    await start('cookies');
    await start('release');
    expect(active()).toEqual(['release']);
    expect(log).toEqual([
      'start cookies',
      'dispose cookies replace',
      'anim cookies',
      'start release',
    ]);
    expect(document.getElementById('cookies')).toBeNull();
    document.dispatchEvent(new KeyboardEvent('keydown'));
    vi.advanceTimersByTime(2000);
    expect(log.filter((l) => l.includes('cookies') && !l.startsWith('start'))).toEqual([
      'dispose cookies replace',
      'anim cookies',
    ]);
    expect(log).toContain('key release');
  });

  it('minor scenes run beside a major one', async () => {
    scene('hud', false, log);
    scene('release', true, log);
    await start('hud');
    await start('release');
    expect(active().sort()).toEqual(['hud', 'release']);
    expect(majorActive()).toBe(true);
    stop('release', 'complete');
    expect(majorActive()).toBe(false);
  });

  it('stillActive turns false once replaced, so awaited work cannot touch the DOM', async () => {
    const ctxA = scene('a', true, log);
    scene('b', true, log);
    await start('a');
    expect(ctxA()?.stillActive()).toBe(true);
    await start('b');
    expect(ctxA()?.stillActive()).toBe(false);
    expect(ctxA()?.signal.aborted).toBe(true);
  });

  it('a scene that throws while starting is stopped and cleaned up', async () => {
    register({
      id: 'broken',
      major: true,
      start(c) {
        c.d.node(document.body.appendChild(document.createElement('p')));
        throw new Error('boom');
      },
    });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await start('broken')).toBe(false);
    expect(isActive('broken')).toBe(false);
    expect(document.body.children.length).toBe(0);
    err.mockRestore();
  });
});

describe('Direct access and navigation', () => {
  it('nothing starts while disabled, and disposeAll stops everything', async () => {
    scene('a', true, log);
    scene('h', false, log);
    await start('a');
    await start('h');
    disposeAll('mode');
    expect(active()).toEqual([]);
    setEnabledCheck(() => false);
    expect(await start('a')).toBe(false);
  });
});

describe('lazy requests', () => {
  it('starts the scene once its chunk arrives', async () => {
    const load = deferred();
    const p = request('lazy', () => load.promise.then(() => scene('lazy', true, log)));
    load.resolve();
    expect(await p).toBe(true);
    expect(isActive('lazy')).toBe(true);
  });

  it('a late import after cancellation starts nothing', async () => {
    const load = deferred();
    const p = request('late', () => load.promise.then(() => scene('late', true, log)));
    disposeAll('navigate');
    load.resolve();
    expect(await p).toBe(false);
    expect(isActive('late')).toBe(false);
    expect(document.body.children.length).toBe(0);
  });

  it('a stopped request, a newer request, or Direct access each make the old one stale', async () => {
    const one = deferred();
    const first = request('x', () => one.promise.then(() => scene('x', true, log)));
    stop('x', 'complete');
    one.resolve();
    expect(await first).toBe(false);

    const a = deferred();
    const b = deferred();
    const older = request('y', () => a.promise.then(() => scene('y', true, log)));
    const newer = request('y', () => b.promise);
    a.resolve();
    expect(await older).toBe(false);
    b.resolve();
    expect(await newer).toBe(true);

    const c = deferred();
    const blocked = request('z', () => c.promise.then(() => scene('z', true, log)));
    setEnabledCheck(() => false);
    c.resolve();
    expect(await blocked).toBe(false);
  });

  it('honours the caller’s own staleness check and a failed import', async () => {
    const d = deferred();
    let wanted = true;
    const p = request(
      'w',
      () => d.promise.then(() => scene('w', true, log)),
      () => wanted,
    );
    wanted = false;
    d.resolve();
    expect(await p).toBe(false);

    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(await request('gone', () => Promise.reject(new Error('404')))).toBe(false);
    err.mockRestore();
  });
});
