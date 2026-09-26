// @vitest-environment happy-dom
/** Step renderers: each performs one beat inside ctx.root, dispatches only semantic events, and
 * leaves nothing behind when its scope is disposed (plan §J, §L). */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { reduce, replay, type CaseState } from '../../src/domain/case';
import { processingMs } from '../../src/domain/assessment';
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

const still: ModalityProfile = {
  reducedMotion: () => false,
  finePointer: () => true,
  onChange: () => {},
};

/** A minimal kernel stand-in: reduces dispatched events and notifies subscribers. */
function harness(events: CaseEvent[], opts: { userInitiated?: boolean } = {}) {
  let state: CaseState = replay(SEED, events).state;
  const root = document.body.appendChild(document.createElement('div'));
  const heading = document.body.appendChild(document.createElement('h2'));
  heading.tabIndex = -1;
  const scope = new Scope();
  const dispatched: CaseEvent[] = [];
  const announced: string[] = [];
  const subs = new Set<(n: CaseState, p: CaseState) => void>();
  const ctx: StepContext = {
    root,
    scope,
    modality: still,
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
    wait: (ms) => scope.delay(Math.min(ms, BUDGET.climaxMaxMs)),
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
    ['findings', findings, TO_FINDINGS],
    ['acknowledgment', acknowledgment, [...TO_FINDINGS, { t: 'STEP_COMPLETED', step: 'findings' }]],
  ];

  it.each(cases)('%s: nothing dispatches or ticks after dispose', async (_, m, events) => {
    const t = harness(events);
    const done = Promise.resolve(m.mount(t.ctx)).catch(() => {});
    await vi.advanceTimersByTimeAsync(BUDGET.processingMs.max);
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
