// @vitest-environment happy-dom
/** The kernel: intercepts only what it should, persists, mounts one step, fails open (A7, A8). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const FIXTURE = `
  <p id="case-chip" hidden></p>
  <a href="/resume/" data-case-cta>View résumé</a>
  <section id="case" class="case" data-step="static">
    <p><span data-case-number>Case</span></p>
    <h2 id="case-heading" tabindex="-1">Case in progress</h2>
    <div id="case-status" role="status"></div>
    <div id="case-body"></div>
    <button type="button" data-case-expedite>Request expedited processing</button>
    <a href="/resume/">Open the résumé directly</a>
  </section>
  <div id="notice-slot"></div>
  <div id="announcer"></div>`;

const stored = () => JSON.parse(sessionStorage.getItem('uvcr:case') ?? 'null');
function click(el: Element | null, init: MouseEventInit = {}): MouseEvent {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, ...init });
  el?.dispatchEvent(e);
  return e;
}
/** Lets lazily imported step chunks load (real I/O), then runs fake time forward. */
const flush = async (ms = 0) => {
  await vi.dynamicImportSettled();
  await vi.advanceTimersByTimeAsync(ms);
  await vi.dynamicImportSettled();
};

beforeEach(() => {
  vi.useFakeTimers();
  sessionStorage.clear();
  document.title = 'David Purvis — Software Engineer';
  document.body.innerHTML = FIXTURE;
  document.documentElement.removeAttribute('data-case');
  window.history.replaceState(null, '', '/');
});
afterEach(() => {
  vi.useRealTimers();
  vi.resetModules();
  vi.doUnmock('../../src/steps/scope');
  vi.doUnmock('../../src/runtime/persistence');
});

describe('kernel', () => {
  it('does nothing without its panel (the CTA stays a link)', async () => {
    document.body.innerHTML = '<a href="/resume/" data-case-cta>View résumé</a>';
    const { boot } = await import('../../src/runtime/kernel');
    boot();
    expect(click(document.querySelector('a')).defaultPrevented).toBe(false);
  });

  it('opens a case on a plain click, persists it, and mounts the scope step', async () => {
    const { boot } = await import('../../src/runtime/kernel');
    const scope = boot();
    expect(document.querySelector('#case')?.hasAttribute('hidden')).toBe(true);
    const e = click(document.querySelector('[data-case-cta]'));
    expect(e.defaultPrevented).toBe(true);
    expect(stored().events).toEqual([{ t: 'RESUME_REQUESTED', via: 'cta' }]);
    expect(stored().hint).toBe('open');
    expect(document.documentElement.getAttribute('data-case')).toBe('open');
    await flush(2000);
    expect(document.querySelector('#case-heading')?.textContent).toBe('Scope clarification');
    expect(document.querySelector('#case')?.getAttribute('data-step')).toBe('scope');
    expect(document.title).toMatch(/^Case DRV-\d{6} · Initial review — David Purvis$/);
    scope.dispose();
  });

  it('never intercepts a modified or non-primary click (A8)', async () => {
    const { boot } = await import('../../src/runtime/kernel');
    boot();
    const cta = document.querySelector('[data-case-cta]');
    for (const init of [{ ctrlKey: true }, { metaKey: true }, { shiftKey: true }, { button: 1 }])
      expect(click(cta, init).defaultPrevented).toBe(false);
    expect(stored()).toBeNull();
  });

  it('a step that cannot load approves the request by default (A7)', async () => {
    vi.doMock('../../src/steps/scope', () => {
      throw new Error('chunk failed');
    });
    const err = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { boot } = await import('../../src/runtime/kernel');
    boot();
    click(document.querySelector('[data-case-cta]'));
    await flush();
    expect(stored().events.at(-1)).toEqual({ t: 'SERVICE_UNAVAILABLE', step: 'scope' });
    expect(document.querySelector('#case-heading')?.textContent).toBe('Case closed');
    expect(document.querySelector('#case-body')?.textContent).toContain('approved by default');
    err.mockRestore();
  });

  it('a boot failure before the intercept leaves the CTA a working link (A7)', async () => {
    vi.doMock('../../src/runtime/persistence', () => ({
      load: () => {
        throw new Error('storage exploded');
      },
    }));
    const { boot } = await import('../../src/runtime/kernel');
    expect(() => boot()).toThrow('storage exploded');
    expect(click(document.querySelector('[data-case-cta]')).defaultPrevented).toBe(false);
  });

  it('?mode=recruiter (old links) is expedited at once', async () => {
    window.history.replaceState(null, '', '/?mode=recruiter');
    const { boot } = await import('../../src/runtime/kernel');
    boot();
    expect(stored().events).toEqual([{ t: 'BYPASS_REQUESTED' }]);
    expect(document.querySelector('#case-heading')?.textContent).toBe('Case closed');
    // After authorization the CTA is an ordinary link again.
    expect(click(document.querySelector('[data-case-cta]')).defaultPrevented).toBe(false);
  });

  it('shows the routine notice after six seconds in arrival, and records a dismissal', async () => {
    const { boot } = await import('../../src/runtime/kernel');
    boot();
    await flush(5999);
    expect(document.querySelector('.notice')).toBeNull();
    await flush(1);
    const notice = document.querySelector('.notice');
    expect(notice?.textContent).toContain('A routine review of this session has been scheduled.');
    click(notice?.querySelector('button') ?? null);
    expect(document.querySelector('.notice')).toBeNull();
    expect(stored().events).toEqual([{ t: 'NOTICE_DISMISSED' }]);
  });

  it('a restored open case remounts its step without stealing focus', async () => {
    sessionStorage.setItem(
      'uvcr:case',
      JSON.stringify({
        v: 2,
        seed: 1,
        events: [
          { t: 'RESUME_REQUESTED', via: 'cta' },
          { t: 'SCOPE_STATED', lane: 'gen' },
        ],
        hint: 'open',
      }),
    );
    const { boot } = await import('../../src/runtime/kernel');
    boot();
    await flush();
    expect(document.querySelector('#case-heading')?.textContent).toBe('Approved in principle');
    expect(document.activeElement).not.toBe(document.querySelector('#case-heading'));
  });
});
