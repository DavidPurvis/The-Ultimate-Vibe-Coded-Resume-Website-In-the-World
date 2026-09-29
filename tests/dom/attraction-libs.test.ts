// @vitest-environment happy-dom
/**
 * The small DOM libraries the restored attractions share: native dialogs, toasts, the threat
 * level, evasive controls and the test-only seams. Each is checked for what a visitor relies on
 * (focus returns, nothing lingers, limits hold) rather than for how it is written.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { closeDialog, openDialog } from '../../src/lib/dialog';
import { toast } from '../../src/lib/toast';
import { bump, onThreat, POINTS } from '../../src/lib/threat';
import { runaway } from '../../src/lib/runaway';
import { Disposer, _reset } from '../../src/lib/scene';
import { _resetMode, initMode, setMode } from '../../src/lib/mode';
import { readSession, SESSION_KEY, writeSession } from '../../src/lib/storage';
import { installTestHooks, sample, testSubwayVideos } from '../../src/lib/testHooks';
import { makeRng } from '../../src/lib/rng';
import { readingMinutes } from '../../src/lib/blog.pure';
import { webgl2 } from '../../src/scenes/cube/support';

beforeEach(() => {
  document.body.replaceChildren();
  localStorage.clear();
  sessionStorage.clear();
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe('dialog', () => {
  function dialog(): { d: HTMLDialogElement; opener: HTMLButtonElement } {
    const opener = document.createElement('button');
    const d = document.createElement('dialog');
    d.innerHTML = '<h2 tabindex="-1">Title</h2><button data-close>Close</button>';
    document.body.append(opener, d);
    return { d, opener };
  }

  it('opens modally, focuses its heading, and returns focus to the opener on close', () => {
    const { d, opener } = dialog();
    const onClose = vi.fn();
    opener.focus();
    openDialog(d, { onClose });
    expect(d.open).toBe(true);
    expect(document.activeElement).toBe(d.querySelector('h2'));
    d.querySelector<HTMLElement>('[data-close]')?.click();
    expect(d.open).toBe(false);
    expect(onClose).toHaveBeenCalledWith('close');
    expect(document.activeElement).toBe(opener);
  });

  it('reopening an open dialog does not reset its opener; closing a closed one is a no-op', () => {
    const { d, opener } = dialog();
    const other = document.createElement('button');
    document.body.append(other);
    openDialog(d, { opener, initialFocus: '[data-close]' });
    expect(document.activeElement).toBe(d.querySelector('[data-close]'));
    openDialog(d, { opener: other });
    closeDialog(d, 'done');
    expect(document.activeElement).toBe(opener);
    expect(() => closeDialog(d)).not.toThrow();
  });

  it('a replaced dialog never pulls focus back from its replacement', async () => {
    const { d, opener } = dialog();
    const next = document.createElement('dialog');
    next.innerHTML = '<button>Inside the replacement</button>';
    document.body.append(next);
    openDialog(d, { opener });
    closeDialog(d);
    next.showModal();
    next.querySelector('button')?.focus();
    await new Promise((r) => setTimeout(r, 0)); // the close event may arrive a task later
    expect(document.activeElement).toBe(next.querySelector('button'));
    next.close();
  });

  it('does not restore focus to an opener that has left the page', () => {
    const { d, opener } = dialog();
    openDialog(d, { opener });
    opener.remove();
    closeDialog(d);
    expect(document.activeElement).not.toBe(opener);
  });
});

describe('toast', () => {
  it('needs a stack to exist', () => {
    expect(toast('Nothing to hold it.')).toBeNull();
  });

  it('is a dismissible status, keeps at most three, and leaves on its own', () => {
    vi.useFakeTimers();
    const stack = document.createElement('div');
    stack.dataset.toasts = '';
    document.body.append(stack);
    const first = toast('One', { ms: 2000, iconHtml: '<svg></svg>' });
    expect(first?.getAttribute('role')).toBe('status');
    expect(first?.querySelector('.toast__icon')).not.toBeNull();
    for (const m of ['Two', 'Three', 'Four']) toast(m);
    expect([...stack.children].map((c) => c.querySelector('p')?.textContent)).toEqual([
      'Two',
      'Three',
      'Four',
    ]);
    const last = stack.lastElementChild as HTMLElement;
    last.querySelector('button')?.click();
    expect(stack.children).toHaveLength(2);
    vi.advanceTimersByTime(5000);
    expect(stack.children).toHaveLength(0);
  });

  it('pauses while hovered or focused, then resumes with time to read', () => {
    vi.useFakeTimers();
    const stack = document.createElement('div');
    stack.dataset.toasts = '';
    document.body.append(stack);
    const el = toast('Held', { ms: 1000 });
    el?.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(5000);
    expect(stack.children).toHaveLength(1);
    el?.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(1100);
    expect(stack.children).toHaveLength(1);
    vi.advanceTimersByTime(200);
    expect(stack.children).toHaveLength(0);
    const again = toast('Focused');
    again?.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(10_000);
    expect(stack.children).toHaveLength(1);
    again?.dispatchEvent(new Event('focusout'));
    vi.advanceTimersByTime(5000);
    expect(stack.children).toHaveLength(0);
  });
});

describe('threat', () => {
  it('accumulates in this tab and tells listeners when the level changes', () => {
    const seen: [number, number, boolean][] = [];
    const off = onThreat((score, idx, changed) => seen.push([score, idx, changed]));
    bump('spin');
    writeSession({ threat: 2 });
    bump('spin');
    off();
    bump('spin');
    expect(seen).toEqual([
      [POINTS.spin, 0, false],
      [2 + POINTS.spin, 1, true],
    ]);
    expect(readSession().threat).toBe(3 + POINTS.spin);
  });
});

describe('runaway', () => {
  function media({ fine = true, reduced = false } = {}) {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('pointer: fine') ? fine : q.includes('reduced-motion') ? reduced : false,
      addEventListener() {},
      removeEventListener() {},
    }));
  }
  function setup(mode: 'enter' | 'proximity', extra: Partial<Parameters<typeof runaway>[0]> = {}) {
    const arena = document.createElement('div');
    const el = document.createElement('button');
    el.innerHTML = '<span data-label>Reject all</span>';
    arena.append(el);
    document.body.append(arena);
    arena.getBoundingClientRect = () => new DOMRect(0, 0, 600, 240);
    el.getBoundingClientRect = () => new DOMRect(240, 98, 120, 44);
    const d = new Disposer();
    const onSurrender = vi.fn();
    const r = runaway(
      {
        id: 'reject',
        el,
        arena,
        mode,
        maxDodges: 2,
        labels: ['Reject… all?', 'Fine. Reject all'],
        onSurrender,
        ...extra,
      },
      d,
    );
    return { arena, el, d, r, onSurrender };
  }
  const pointer = (type: string, pointerType: string, x = 300, y = 120) =>
    Object.assign(new MouseEvent(type, { clientX: x, clientY: y, bubbles: true }), {
      pointerType,
    });

  beforeEach(() => {
    _reset();
    _resetMode();
    initMode();
  });

  it('moves away from a mouse a bounded number of times, then surrenders', () => {
    media();
    const { el, d, r, onSurrender } = setup('enter');
    expect(el.classList.contains('runaway')).toBe(true);
    el.dispatchEvent(pointer('pointerenter', 'touch'));
    expect(el.style.transform).toBe('');
    el.dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(el.style.transform).toMatch(/^translate\(/);
    expect(el.textContent).toBe('Reject… all?');
    el.dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(onSurrender).toHaveBeenCalledOnce();
    expect(r.surrendered()).toBe(true);
    expect(el.textContent).toBe('Fine. Reject all');
    expect(readSession().dodges.reject).toBe(2);
    el.dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(readSession().dodges.reject).toBe(2);
    r.reset();
    expect(el.style.transform).toBe('');
    d.dispose();
    expect(el.classList.contains('runaway')).toBe(false);
  });

  it('escalates in words only when motion is reduced, and never for coarse pointers', () => {
    media({ reduced: true });
    const a = setup('enter');
    a.el.dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(a.el.style.transform).toBe('');
    expect(a.el.textContent).toBe('Reject… all?');
    a.d.dispose();
    sessionStorage.clear();
    media({ fine: false });
    const b = setup('enter', { id: 'coarse' });
    b.el.dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(readSession().dodges.coarse).toBeUndefined();
  });

  it('in proximity mode, one approach is one dodge, and Direct access stops it', () => {
    media();
    const { arena, el } = setup('proximity', { maxDodges: 5 });
    arena.dispatchEvent(pointer('pointermove', 'mouse', 590, 230));
    expect(readSession().dodges.reject).toBeUndefined();
    arena.dispatchEvent(pointer('pointermove', 'mouse', 300, 120));
    expect(readSession().dodges.reject).toBe(1);
    arena.dispatchEvent(pointer('pointerleave', 'mouse'));
    setMode('recruiter');
    el.style.transform = '';
    arena.dispatchEvent(pointer('pointermove', 'mouse', 300, 120));
    expect(readSession().dodges.reject).toBe(1);
  });

  it('only dodges inside its time window, when it has one', () => {
    media();
    const { el } = setup('enter', { id: 'fast', timeWindowMs: -1 });
    el.dispatchEvent(pointer('pointerenter', 'mouse'));
    expect(readSession().dodges.fast).toBeUndefined();
  });
});

describe('test hooks', () => {
  it('install nothing unless the build asked for them', () => {
    installTestHooks();
    expect('__uvcr' in globalThis).toBe(false);
    expect(sample(() => 0.25)).toBe(0.25);
  });

  it('force samples, stub gameplay and reset the session in a test build', () => {
    vi.stubEnv('PUBLIC_TEST_HOOKS', '1');
    installTestHooks();
    const hooks = (globalThis as unknown as { __uvcr: Record<string, (...a: never[]) => void> })
      .__uvcr;
    (hooks.forceSample as (...x: number[]) => void)(0.9);
    expect(sample(() => 0.1)).toBe(0.9);
    expect(sample(() => 0.1)).toBe(0.1);
    (hooks.subwayVideos as (...ids: string[]) => void)('clip');
    expect(testSubwayVideos()).toEqual(['clip']);
    writeSession({ threat: 4 });
    (hooks.resetSession as () => void)();
    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    delete (globalThis as { __uvcr?: unknown }).__uvcr;
  });
});

describe('seeds and reading time', () => {
  it('an unseeded wheel still draws from [0, 1)', () => {
    const x = makeRng('')();
    expect(x).toBeGreaterThanOrEqual(0);
    expect(x).toBeLessThan(1);
  });

  it('estimates reading time in whole minutes, never zero', () => {
    expect(readingMinutes('')).toBe(1);
    expect(readingMinutes(`<p>${'word '.repeat(660)}</p>`)).toBe(3);
  });
});

describe('the tungsten cube’s WebGL check', () => {
  it('asks for WebGL2 before three.js is fetched, and a refusal or an error means no', () => {
    const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
    getContext.mockReturnValueOnce({} as WebGL2RenderingContext);
    expect(webgl2()).toBe(true);
    expect(getContext).toHaveBeenLastCalledWith('webgl2');
    getContext.mockReturnValueOnce(null);
    expect(webgl2()).toBe(false);
    getContext.mockImplementationOnce(() => {
      throw new Error('blocked');
    });
    expect(webgl2()).toBe(false);
    getContext.mockRestore();
  });
});
