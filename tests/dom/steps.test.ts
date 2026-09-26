// @vitest-environment happy-dom
/** Step renderers: each performs one beat inside ctx.root, dispatches only semantic events, and
 * leaves nothing behind when its scope is disposed (plan §J, §L). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reduce, replay, type CaseState } from '../../src/domain/case';
import { processingMs, releaseSlots, serviceRows } from '../../src/domain/assessment';
import { BUDGET } from '../../src/domain/steps';
import type { CaseEvent } from '../../src/domain/events';
import { Scope } from '../../src/runtime/lifecycle';
import type { ModalityProfile } from '../../src/runtime/modality';
import type { StepContext, StepModule } from '../../src/steps/types';
import * as scopeStep from '../../src/steps/scope';
import * as preview from '../../src/steps/preview';
import * as findings from '../../src/steps/findings';
import * as acknowledgment from '../../src/steps/acknowledgment';
import * as disposition from '../../src/steps/disposition';
import * as notice from '../../src/steps/notice';
import * as release from '../../src/steps/release';
import * as ceremony from '../../src/steps/ceremony';

const SEED = 4242;
const OPEN: CaseEvent = { t: 'RESUME_REQUESTED', via: 'cta' };
const TO_FINDINGS: CaseEvent[] = [
  OPEN,
  { t: 'SCOPE_STATED', lane: 'plt' },
  { t: 'RESUME_REQUESTED', via: 'full-document' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'STEP_COMPLETED', step: 'ceremony' },
];

/** A controllable modality: tests flip motion or pointer and fire the change callbacks. */
function fakeModality(init: { reduced?: boolean; fine?: boolean } = {}) {
  const m = { reduced: init.reduced ?? false, fine: init.fine ?? true };
  const fns = new Set<() => void>();
  const profile: ModalityProfile = {
    reducedMotion: () => m.reduced,
    finePointer: () => m.fine,
    onChange(scope, fn) {
      fns.add(fn);
      scope.add(() => fns.delete(fn));
    },
  };
  const setReduced = (v: boolean) => {
    m.reduced = v;
    for (const fn of [...fns]) fn();
  };
  return { profile, setReduced };
}

/** A minimal kernel stand-in: reduces dispatched events and notifies subscribers. */
function harness(
  events: CaseEvent[],
  opts: { userInitiated?: boolean; modality?: ModalityProfile } = {},
) {
  let state: CaseState = replay(SEED, events).state;
  const root = document.body.appendChild(document.createElement('div'));
  const heading = document.body.appendChild(document.createElement('h2'));
  heading.id = 'case-heading';
  heading.tabIndex = -1;
  const scope = new Scope();
  const dispatched: CaseEvent[] = [];
  const announced: string[] = [];
  const subs = new Set<(n: CaseState, p: CaseState) => void>();
  const ctx: StepContext = {
    root,
    scope,
    modality: opts.modality ?? fakeModality().profile,
    caseNumber: 'DRV-123456',
    userInitiated: opts.userInitiated ?? true,
    state: () => state,
    subscribe(fn) {
      subs.add(fn);
      scope.add(() => subs.delete(fn));
    },
    dispatch(e) {
      dispatched.push(e);
      const next = reduce(state, e);
      if (next === state) return;
      const prev = state;
      state = next;
      if (next.step === prev.step && !next.authorized) for (const fn of [...subs]) fn(next, prev);
    },
    processing: () => scope.delay(state.step ? processingMs(SEED, state.step) : 0),
    wait: (ms, within = scope) => within.delay(Math.min(ms, BUDGET.climaxMaxMs)),
    announce: (t) => announced.push(t),
    setHeading: (t) => {
      heading.textContent = t;
    },
    focusHeading: () => heading.focus(),
  };
  return { ctx, root, heading, scope, dispatched, announced, state: () => state };
}

const buttons = (root: Element) => [...root.querySelectorAll('button')];
const byText = (root: Element, text: string) =>
  buttons(root).find((b) => b.textContent === text) ?? null;

beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(navigator, 'globalPrivacyControl', {
    configurable: true,
    get: () => false,
  });
});
afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe('scope', () => {
  it('processes within budget, then asks; an empty answer is refused, any answer is accepted', async () => {
    const t = harness([OPEN]);
    const done = scopeStep.mount(t.ctx);
    expect(t.heading.textContent).toBe('Scope clarification');
    expect(t.root.querySelector('fieldset')).toBeNull();
    const ms = processingMs(SEED, 'scope');
    expect(ms).toBeGreaterThanOrEqual(BUDGET.processingMs.min);
    expect(ms).toBeLessThanOrEqual(BUDGET.processingMs.max);
    await vi.advanceTimersByTimeAsync(ms);
    await done;
    const radios = t.root.querySelectorAll<HTMLInputElement>('input[type=radio]');
    expect(radios).toHaveLength(5);
    byText(t.root, 'Submit scope')?.click();
    expect(t.dispatched).toEqual([]);
    expect(t.root.querySelector<HTMLElement>('#scope-error')?.hidden).toBe(false);
    radios[1]?.click();
    byText(t.root, 'Submit scope')?.click();
    expect(t.dispatched).toEqual([{ t: 'SCOPE_STATED', lane: 'plt' }]);
    expect(t.state().step).toBe('preview');
  });

  it('disposing mid-processing abandons the step quietly', async () => {
    const t = harness([OPEN]);
    const done = scopeStep.mount(t.ctx);
    t.scope.dispose();
    await expect(done).rejects.toMatchObject({ name: 'AbortError' });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe('preview', () => {
  it('releases real content from the stated scope, marked as résumé evidence', () => {
    const t = harness([OPEN, { t: 'SCOPE_STATED', lane: 'emb' }]);
    preview.mount(t.ctx);
    const extract = t.root.querySelector('[data-evidence="resume"]');
    expect(extract?.querySelectorAll('li')).toHaveLength(3);
    byText(t.root, 'Request full document')?.click();
    expect(t.dispatched).toEqual([{ t: 'RESUME_REQUESTED', via: 'full-document' }]);
    expect(t.state().step).toBe('release');
  });
});

const AT_RELEASE: CaseEvent[] = [
  OPEN,
  { t: 'SCOPE_STATED', lane: 'plt' },
  { t: 'RESUME_REQUESTED', via: 'full-document' },
];
const AT_CEREMONY: CaseEvent[] = [...AT_RELEASE, ...Array(3).fill({ t: 'RELEASE_ATTEMPTED' })];

/** A click as each input produces it: keyboard activation has detail 0; touch has a pointer type. */
function activate(el: Element | null, input: 'mouse' | 'touch' | 'keyboard'): void {
  const init = { bubbles: true, cancelable: true, clientX: 10, clientY: 10 };
  const e =
    input === 'touch'
      ? new PointerEvent('click', { ...init, pointerType: 'touch', detail: 1 })
      : new MouseEvent('click', { ...init, detail: input === 'keyboard' ? 0 : 1 });
  el?.dispatchEvent(e);
}
const hover = (el: Element | null, pointerType = 'mouse') =>
  el?.dispatchEvent(new PointerEvent('pointerenter', { pointerType, clientX: 10, clientY: 10 }));

describe('release', () => {
  const control = (root: Element) => root.querySelector<HTMLButtonElement>('[data-release]');
  const slot = (root: Element) => root.querySelector<HTMLElement>('.release-arena')?.dataset.slot;
  const order = releaseSlots(SEED).map(String);

  it('keyboard: the control never moves; the request is reassigned in words, twice', () => {
    const t = harness(AT_RELEASE);
    release.mount(t.ctx);
    expect(t.heading.textContent).toBe('Behavioral review');
    const c = control(t.root);
    c?.focus();
    activate(c, 'keyboard');
    expect(c?.textContent).toBe('Release document (under review)');
    expect(t.root.querySelector('#release-status')?.textContent).toBe(
      'Request reassigned to Window 2.',
    );
    activate(c, 'keyboard');
    expect(c?.textContent).toBe('Release document (reassigned)');
    expect(t.announced).toEqual([
      'Request reassigned to Window 2.',
      'Request reassigned to Window 3.',
    ]);
    expect(c?.style.transform).toBe('');
    expect(slot(t.root)).toBe(order[0]);
    expect(document.activeElement).toBe(c);
    activate(c, 'keyboard');
    expect(t.state().step).toBe('ceremony');
    expect(t.state().resisted).toBe(2);
  });

  it('touch: the control visits its next slot on each resisted tap, then releases', () => {
    const t = harness(AT_RELEASE, { modality: fakeModality({ fine: false }).profile });
    release.mount(t.ctx);
    const c = control(t.root);
    hover(c, 'touch'); // a touch "enter" is not an attempt
    expect(t.dispatched).toEqual([]);
    const seen = [slot(t.root)];
    activate(c, 'touch');
    seen.push(slot(t.root));
    activate(c, 'touch');
    seen.push(slot(t.root));
    expect(seen).toEqual(order);
    activate(c, 'touch');
    expect(t.state().step).toBe('ceremony');
  });

  it('mouse: the approach is the attempt, twice; after that it holds still and a click works', () => {
    const t = harness(AT_RELEASE);
    release.mount(t.ctx);
    const c = control(t.root);
    hover(c);
    expect(c?.style.transform).toMatch(/^translate\(/);
    hover(c);
    hover(c); // budget spent: approaching no longer counts
    expect(t.dispatched).toEqual([{ t: 'RELEASE_ATTEMPTED' }, { t: 'RELEASE_ATTEMPTED' }]);
    activate(c, 'mouse');
    expect(t.state().step).toBe('ceremony');
  });

  it('reduced motion: nothing moves for any input, and the count is the same', () => {
    const t = harness(AT_RELEASE, { modality: fakeModality({ reduced: true }).profile });
    release.mount(t.ctx);
    const c = control(t.root);
    hover(c);
    expect(t.dispatched).toEqual([]);
    activate(c, 'mouse');
    activate(c, 'touch');
    expect(c?.style.transform).toBe('');
    expect(slot(t.root)).toBe(order[0]);
    activate(c, 'mouse');
    expect(t.state().step).toBe('ceremony');
    expect(t.dispatched).toHaveLength(3);
  });

  it('switching to reduced motion mid-review sends a displaced control home', () => {
    const m = fakeModality();
    const t = harness(AT_RELEASE, { modality: m.profile });
    release.mount(t.ctx);
    const c = control(t.root);
    hover(c);
    expect(c?.style.transform).not.toBe('');
    m.setReduced(true);
    expect(c?.style.transform).toBe('');
  });

  it('a restored review keeps its count and its words', () => {
    const t = harness([...AT_RELEASE, { t: 'RELEASE_ATTEMPTED' }], { userInitiated: false });
    release.mount(t.ctx);
    expect(control(t.root)?.textContent).toBe('Release document (under review)');
    expect(t.root.querySelector('#release-status')?.textContent).toBe(
      'Request reassigned to Window 2.',
    );
  });
});

describe('ceremony', () => {
  const rows = (root: Element) => [...root.querySelectorAll('tbody tr')];
  const pending = (root: Element) =>
    rows(root).filter((r) => r.children[1]?.textContent === 'Pending').length;

  it('eleven services resolve within the climax budget; skip is the first control', async () => {
    const t = harness(AT_CEREMONY);
    const done = ceremony.mount(t.ctx);
    expect(t.heading.textContent).toBe('Escalated review');
    expect(buttons(t.root)[0]?.textContent).toBe('Skip ceremony');
    expect(rows(t.root)).toHaveLength(11);
    expect(pending(t.root)).toBe(11);
    expect(t.root.getAttribute('aria-busy')).toBe('true');
    expect(t.root.querySelector('[data-evidence="resume"]')?.textContent).toMatch(
      /^Bullet under review.{40,}/,
    );
    const total = serviceRows(t.state()).reduce((n, r) => n + r.latencyMs, 0);
    expect(total).toBeLessThanOrEqual(BUDGET.climaxMaxMs);
    await vi.advanceTimersByTimeAsync(total - 1);
    expect(pending(t.root)).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    await done;
    expect(pending(t.root)).toBe(0);
    expect(t.root.hasAttribute('aria-busy')).toBe(false);
    expect(t.announced).toEqual([
      'All eleven services concur: the bullet is accurate. It was accurate before the review.',
    ]);
    expect(t.root.querySelector('[data-service="persistence"]')?.textContent).toContain(
      'Visitor was reassigned and returned.',
    );
    expect(t.root.querySelector('[data-service="status-inversion"]')?.textContent).toContain(
      'Ordained Minister',
    );
    byText(t.root, 'Continue')?.click();
    expect(t.dispatched.at(-1)).toEqual({ t: 'STEP_COMPLETED', step: 'ceremony' });
    expect(t.state().step).toBe('findings');
  });

  it('can be skipped at once, and the skip is on the record', () => {
    const t = harness(AT_CEREMONY);
    void ceremony.mount(t.ctx).catch(() => {});
    byText(t.root, 'Skip ceremony')?.click();
    expect(t.state().step).toBe('findings');
    expect(t.state().findings.CEREMONY_DECLINED?.count).toBe(1);
    t.scope.dispose();
  });

  it('reduced motion: every row is already resolved and nothing waits', async () => {
    const t = harness(AT_CEREMONY, { modality: fakeModality({ reduced: true }).profile });
    await ceremony.mount(t.ctx);
    expect(pending(t.root)).toBe(0);
    expect(vi.getTimerCount()).toBe(0);
    expect(t.root.textContent).toContain('Motion preference honored.');
    expect(byText(t.root, 'Continue')).not.toBeNull();
  });

  it('switching to reduced motion mid-ceremony finishes it immediately', async () => {
    const m = fakeModality();
    const t = harness(AT_CEREMONY, { modality: m.profile });
    const done = ceremony.mount(t.ctx);
    await vi.advanceTimersByTimeAsync(200);
    expect(pending(t.root)).toBeGreaterThan(0);
    m.setReduced(true);
    await done;
    expect(pending(t.root)).toBe(0);
    expect(t.root.textContent).toContain('Motion preference honored.');
  });

  it('moves focus to the result only if the visitor left it on the heading', async () => {
    const t = harness(AT_CEREMONY);
    t.heading.focus();
    const done = ceremony.mount(t.ctx);
    await vi.advanceTimersByTimeAsync(BUDGET.climaxMaxMs);
    await done;
    expect(document.activeElement?.id).toBe('ceremony-result');

    const u = harness(AT_CEREMONY);
    const done2 = ceremony.mount(u.ctx);
    byText(u.root, 'Skip ceremony')?.focus();
    u.ctx.dispatch({ t: 'NOTICE_DISMISSED' }); // no-op mid-case: focus must still be left alone
    await vi.advanceTimersByTimeAsync(BUDGET.climaxMaxMs);
    await done2;
    expect(document.activeElement?.textContent).toBe('Skip ceremony');
  });
});

describe('findings', () => {
  it('cites only earlier evidence, states what was transmitted, and proceeds', async () => {
    const t = harness(TO_FINDINGS);
    const done = findings.mount(t.ctx);
    await vi.advanceTimersByTimeAsync(BUDGET.processingMs.max);
    await done;
    const text = t.root.textContent ?? '';
    expect(text).toMatch(/Risk score: 0\.\d{4}\./);
    expect(text).toContain('Repeated selection of "View résumé."');
    expect(text).toContain('Persistence: 2 release attempts after reassignment.');
    expect(text).toContain('Events transmitted: 0');
    expect(text).not.toContain('Global Privacy Control');
    byText(t.root, 'Proceed to adjudication')?.click();
    expect(t.state().step).toBe('acknowledgment');
  });

  it('says so when Global Privacy Control suspended observation', async () => {
    Object.defineProperty(navigator, 'globalPrivacyControl', {
      configurable: true,
      get: () => true,
    });
    const t = harness(TO_FINDINGS);
    const done = findings.mount(t.ctx);
    await vi.advanceTimersByTimeAsync(BUDGET.processingMs.max);
    await done;
    expect(t.root.textContent).toContain('Global Privacy Control honored.');
  });
});

describe('acknowledgment', () => {
  const AT_ACK = [...TO_FINDINGS, { t: 'STEP_COMPLETED', step: 'findings' } as const];

  it('acknowledge, confirm: two screens, then authorized', () => {
    const t = harness(AT_ACK);
    acknowledgment.mount(t.ctx);
    expect(t.heading.textContent).toBe('Conditional approval');
    byText(t.root, 'Acknowledge')?.click();
    expect(t.heading.textContent).toBe('Confirm acknowledgment');
    expect(document.activeElement).toBe(t.heading);
    byText(t.root, 'Confirm')?.click();
    expect(t.state().authorized).toEqual({ via: 'adjudicated' });
  });

  it('an appeal is granted, and so was the original decision: three screens at most', () => {
    const t = harness(AT_ACK);
    acknowledgment.mount(t.ctx);
    byText(t.root, 'Acknowledge')?.click();
    byText(t.root, 'Appeal')?.click();
    expect(t.heading.textContent).toBe('Appeal decided');
    expect(byText(t.root, 'Appeal')).toBeNull();
    byText(t.root, 'Continue')?.click();
    expect(t.state().authorized).toEqual({ via: 'appeal-reconciled' });
    expect(t.announced).toEqual(['Confirm acknowledgment', 'Appeal decided']);
  });

  it('a double click is one acknowledgment', () => {
    const t = harness(AT_ACK);
    acknowledgment.mount(t.ctx);
    const yes = byText(t.root, 'Acknowledge');
    yes?.click();
    yes?.click(); // the old button is detached, and its listener belonged to the same scope
    expect(t.state().ack).toBe('acknowledged');
  });
});

describe('disposition', () => {
  it('renders nothing unless the case is authorized', () => {
    const t = harness([OPEN]);
    disposition.mount(t.ctx);
    expect(t.root.childElementCount).toBe(0);
  });

  it('cites the session and links the stated cut; the link takes focus when earned', () => {
    const t = harness([
      ...TO_FINDINGS,
      { t: 'STEP_COMPLETED', step: 'findings' },
      { t: 'ACKNOWLEDGED' },
      { t: 'ACKNOWLEDGED' },
    ]);
    disposition.mount(t.ctx);
    const text = t.root.textContent ?? '';
    expect(text).toContain('Disposition: access granted after adjudication.');
    expect(text).toContain('Stated scope: Platform / SRE.');
    expect(text).toContain('Release attempts resisted: 2 of 2 permitted.');
    const open = t.root.querySelector<HTMLAnchorElement>('a[data-case-open]');
    expect(open?.getAttribute('href')).toMatch(/\/resume\/for\/plt\/$/);
    expect(open?.textContent).toBe('Open résumé (Platform / SRE)');
    expect(document.activeElement).toBe(open);
    expect(t.root.querySelectorAll('.case-stamp')).toHaveLength(1);
  });

  it('expedited: plain link to the general résumé, no focus theft on restore', () => {
    const t = harness([OPEN, { t: 'BYPASS_REQUESTED' }], { userInitiated: false });
    disposition.mount(t.ctx);
    const open = t.root.querySelector<HTMLAnchorElement>('a[data-case-open]');
    expect(open?.getAttribute('href')).toMatch(/\/resume\/$/);
    expect(t.root.textContent).toContain('It was always available.');
    expect(document.activeElement).not.toBe(open);
    expect(t.announced).toEqual([]);
  });
});

describe('notice', () => {
  it('asks for nothing, records a dismissal, and is removed with its scope', () => {
    const t = harness([]);
    notice.mount(t.ctx);
    const aside = t.root.querySelector('aside.notice');
    expect(aside?.getAttribute('role')).toBe('status');
    byText(t.root, 'Dismiss')?.click();
    expect(t.dispatched).toEqual([{ t: 'NOTICE_DISMISSED' }]);
    t.scope.dispose();
    expect(aside?.isConnected).toBe(false);
  });
});

describe('every step', () => {
  const cases: [string, StepModule, CaseEvent[]][] = [
    ['scope', scopeStep, [OPEN]],
    ['preview', preview, [OPEN, { t: 'SCOPE_STATED', lane: 'gen' }]],
    ['release', release, AT_RELEASE],
    ['ceremony', ceremony, AT_CEREMONY],
    ['findings', findings, TO_FINDINGS],
    ['acknowledgment', acknowledgment, [...TO_FINDINGS, { t: 'STEP_COMPLETED', step: 'findings' }]],
  ];

  it.each(cases)('%s: nothing dispatches or ticks after dispose', async (_, m, events) => {
    const t = harness(events);
    const done = Promise.resolve(m.mount(t.ctx)).catch(() => {});
    await vi.advanceTimersByTimeAsync(BUDGET.processingMs.max + BUDGET.climaxMaxMs);
    await done;
    const controls = buttons(t.root);
    expect(controls.length).toBeGreaterThan(0);
    t.scope.dispose();
    for (const b of controls) b.click();
    expect(t.dispatched).toEqual([]);
    expect(vi.getTimerCount()).toBe(0);
    for (const b of controls) expect(b.classList.contains('case-btn')).toBe(true);
  });
});
