// @vitest-environment happy-dom
/** Browser signals become semantic events, and nothing else (plan §F, X6, P6). */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyTarget, installSignals, privacySignal } from '../../src/runtime/signals';
import { Scope } from '../../src/runtime/lifecycle';
import type { CaseEvent } from '../../src/domain/events';

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => (hidden ? 'hidden' : 'visible'),
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

function setup(nav: Partial<{ gpc: boolean }> = {}) {
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    configurable: true,
    get: () => nav.gpc ?? false,
  });
  const events: CaseEvent[] = [];
  const visibility: boolean[] = [];
  let t = 0;
  const scope = new Scope();
  installSignals(scope, {
    dispatch: (e) => events.push(e),
    onVisibility: (h) => visibility.push(h),
    now: () => t,
  });
  return {
    events,
    visibility,
    scope,
    tick: (ms: number) => {
      t += ms;
    },
  };
}

afterEach(() => {
  document.body.replaceChildren();
});

describe('signals', () => {
  it('registers only visibilitychange, copy and beforeprint', () => {
    const spyDoc = vi.spyOn(document, 'addEventListener');
    const spyWin = vi.spyOn(window, 'addEventListener');
    const { scope } = setup();
    const types = [...spyDoc.mock.calls, ...spyWin.mock.calls].map((c) => c[0]).sort();
    expect(types).toEqual(['beforeprint', 'copy', 'visibilitychange']);
    scope.dispose();
    spyDoc.mockRestore();
    spyWin.mockRestore();
  });

  it('a hide/show pair is one consultation, bucketed, never a duration', () => {
    const s = setup();
    setHidden(true);
    s.tick(5000);
    setHidden(false);
    setHidden(true);
    s.tick(45_000);
    setHidden(false);
    expect(s.events).toEqual([
      { t: 'EXTERNAL_CONSULTATION', duration: 'brief' },
      { t: 'EXTERNAL_CONSULTATION', duration: 'extended' },
    ]);
    expect(s.visibility).toEqual([true, false, true, false]);
    s.scope.dispose();
  });

  it('copy reports where, never what, at most every ten seconds', () => {
    const s = setup();
    const contact = document.body.appendChild(document.createElement('section'));
    contact.dataset.evidence = 'contact';
    const text = contact.appendChild(document.createTextNode('davidpurvis647@gmail.com'));
    vi.spyOn(document, 'getSelection').mockReturnValue({
      anchorNode: text,
    } as unknown as Selection);
    document.dispatchEvent(new Event('copy'));
    document.dispatchEvent(new Event('copy'));
    s.tick(10_000);
    document.dispatchEvent(new Event('copy'));
    expect(s.events).toEqual([
      { t: 'TEXT_COPIED', target: 'contact' },
      { t: 'TEXT_COPIED', target: 'contact' },
    ]);
    expect(JSON.stringify(s.events)).not.toContain('davidpurvis647');
    s.scope.dispose();
    vi.restoreAllMocks();
  });

  it('classifies copy targets by the nearest evidence block', () => {
    const outer = document.body.appendChild(document.createElement('div'));
    outer.dataset.evidence = 'case';
    const inner = outer.appendChild(document.createElement('p'));
    expect(copyTarget(inner)).toBe('case');
    expect(copyTarget(document.body)).toBe('other');
    expect(copyTarget(null)).toBe('other');
  });

  it('Global Privacy Control suspends observation but printing is still honored', () => {
    const s = setup({ gpc: true });
    expect(privacySignal()).toBe(true);
    setHidden(true);
    setHidden(false);
    document.dispatchEvent(new Event('copy'));
    window.dispatchEvent(new Event('beforeprint'));
    expect(s.events).toEqual([{ t: 'PRINT_REQUESTED' }]);
    s.scope.dispose();
  });

  it('dispatches nothing once disposed', () => {
    const s = setup();
    s.scope.dispose();
    window.dispatchEvent(new Event('beforeprint'));
    setHidden(true);
    setHidden(false);
    expect(s.events).toEqual([]);
  });
});
