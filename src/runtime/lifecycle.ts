/**
 * The lifecycle contract. Everything an interactive feature allocates (listeners, timers,
 * animation frames, observers, animations, inserted nodes, iframes) is owned by a Scope, and
 * disposing the Scope releases all of it: listeners through AbortSignal, the rest through LIFO
 * cleanups. No feature may rely on the page unloading to clean up after it.
 */
export class Scope {
  private readonly ac = new AbortController();
  private readonly cleanups: (() => void)[] = [];
  private readonly children = new Set<Scope>();
  private done = false;

  constructor(parent?: Scope) {
    if (!parent) return;
    if (parent.disposed) {
      this.dispose();
      return;
    }
    parent.children.add(this);
    this.add(() => parent.children.delete(this));
  }

  get signal(): AbortSignal {
    return this.ac.signal;
  }
  get disposed(): boolean {
    return this.done;
  }

  /** Run `fn` on dispose (LIFO). Runs immediately if the scope is already disposed. */
  add(fn: () => void): void {
    if (this.done) {
      safely(fn);
      return;
    }
    this.cleanups.push(fn);
  }

  on(
    target: EventTarget,
    type: string,
    fn: EventListenerOrEventListenerObject,
    opts: AddEventListenerOptions = {},
  ): void {
    if (this.done) return;
    target.addEventListener(type, fn, { ...opts, signal: this.ac.signal });
  }

  timeout(fn: () => void, ms: number): void {
    if (this.done) return;
    const id = setTimeout(fn, ms);
    this.add(() => clearTimeout(id));
  }

  interval(fn: () => void, ms: number): void {
    if (this.done) return;
    const id = setInterval(fn, ms);
    this.add(() => clearInterval(id));
  }

  /** rAF loop; `loop` returns false to stop. dt (ms) is capped at 50 to survive tab suspension. */
  raf(loop: (t: number, dt: number) => boolean): void {
    if (this.done) return;
    let last: number | null = null;
    let id = 0;
    let stopped = false;
    const tick = (t: number) => {
      if (stopped) return;
      const dt = last === null ? 0 : Math.min(50, t - last);
      last = t;
      if (!loop(t, dt)) {
        stopped = true;
        return;
      }
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    this.add(() => {
      stopped = true;
      cancelAnimationFrame(id);
    });
  }

  observe(o: { disconnect(): void }): void {
    this.add(() => o.disconnect());
  }

  animate(a: { cancel(): void }): void {
    this.add(() => a.cancel());
  }

  /** Track a node this scope inserted; it is removed on dispose. */
  node<T extends Node>(n: T): T {
    this.add(() => n.parentNode?.removeChild(n));
    return n;
  }

  /** An iframe whose runtime (and audio) must end on dispose. */
  frame(f: HTMLIFrameElement): void {
    this.add(() => {
      f.src = 'about:blank';
      f.remove();
    });
  }

  /** Resolves after `ms`; rejects with an AbortError if the scope is disposed first. */
  delay(ms: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.done) {
        reject(abortError());
        return;
      }
      const id = setTimeout(resolve, ms);
      this.ac.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(id);
          reject(abortError());
        },
        { once: true },
      );
    });
  }

  child(): Scope {
    return new Scope(this);
  }

  /** Idempotent: abort listeners, dispose children, then run cleanups last-in first-out. */
  dispose(): void {
    if (this.done) return;
    this.done = true;
    this.ac.abort();
    for (const c of [...this.children]) c.dispose();
    for (const fn of this.cleanups.splice(0).reverse()) safely(fn);
  }
}

function safely(fn: () => void): void {
  try {
    fn();
  } catch (e) {
    console.error(e);
  }
}

function abortError(): Error {
  const e = new Error('Scope disposed');
  e.name = 'AbortError';
  return e;
}

export const isAbort = (e: unknown): boolean => e instanceof Error && e.name === 'AbortError';

export interface MountContext {
  readonly root: HTMLElement;
  readonly scope: Scope;
}

/**
 * Mount a page-level feature. The page Scope is disposed when the document is really unloaded
 * (pagehide without bfcache); a bfcache restore keeps the live scope as it was.
 */
export function mountPage(
  mount: (ctx: MountContext) => void | Promise<void>,
  root?: HTMLElement,
): Scope {
  const scope = new Scope();
  const run = () => {
    Promise.resolve()
      .then(() => mount({ root: root ?? document.body, scope }))
      .catch((e: unknown) => {
        if (!isAbort(e)) console.error(e);
      });
  };
  if (document.readyState === 'loading')
    scope.on(document, 'DOMContentLoaded', run, { once: true });
  else run();
  window.addEventListener(
    'pagehide',
    (e) => {
      if (!(e as PageTransitionEvent).persisted) scope.dispose();
    },
    { signal: scope.signal },
  );
  return scope;
}
