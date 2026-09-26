/**
 * The case kernel on `/`: the only place that reduces, persists and mounts steps.
 *
 *   browser signal → (step renderer | signals.ts) → CaseEvent → reduce → log + save → render
 *   → exactly one step renderer, chosen by phase, performing for the visitor's modality.
 *
 * It fails open everywhere: if it never starts, the CTA is still a link to the résumé; if a step
 * cannot load or throws, the case is approved by default.
 */
import { phase, reduce, type CaseState } from '../domain/case';
import type { CaseEvent } from '../domain/events';
import { BUDGET, type StepId } from '../domain/steps';
import { caseNumber, processingMs } from '../domain/assessment';
import { newFindings, type FindingId } from '../domain/findings';
import { consoleLine, findingLines } from '../content/institution/case';
import { isPlainActivation } from '../lib/links';
import { url } from '../lib/paths';
import { isAbort, Scope } from './lifecycle';
import { load, save } from './persistence';
import { modality } from './modality';
import { announce } from './announce';
import { installSignals } from './signals';
import { chipFor, hiddenTitle, titleFor } from './title';
import * as disposition from '../steps/disposition';
import * as notice from '../steps/notice';
import type { StepContext, StepModule } from '../steps/types';

const LOADERS: Record<StepId, () => Promise<StepModule>> = {
  scope: () => import('../steps/scope'),
  preview: () => import('../steps/preview'),
  release: () => import('../steps/release'),
  ceremony: () => import('../steps/ceremony'),
  findings: () => import('../steps/findings'),
  acknowledgment: () => import('../steps/acknowledgment'),
};

interface Elements {
  panel: HTMLElement;
  heading: HTMLElement;
  status: HTMLElement;
  body: HTMLElement;
  number: HTMLElement | null;
  chip: HTMLElement | null;
  cta: HTMLAnchorElement | null;
  expedite: HTMLElement | null;
  noticeSlot: HTMLElement | null;
}

function elements(doc: Document): Elements | null {
  const q = <T extends HTMLElement>(sel: string) => doc.querySelector<T>(sel);
  const panel = q('#case');
  const heading = q('#case-heading');
  const status = q('#case-status');
  const body = q('#case-body');
  if (!panel || !heading || !status || !body) return null;
  return {
    panel,
    heading,
    status,
    body,
    number: q('[data-case-number]'),
    chip: q('#case-chip'),
    cta: q<HTMLAnchorElement>('a[data-case-cta]'),
    expedite: q('[data-case-expedite]'),
    noticeSlot: q('#notice-slot'),
  };
}

export function boot(doc: Document = document): Scope {
  const scope = new Scope();
  const els = elements(doc);
  if (!els) return scope;

  const loaded = load();
  const { seed } = loaded;
  let state = loaded.state;
  const log: CaseEvent[] = [...loaded.log];
  const caseNo = caseNumber(seed);
  const arrivalTitle = doc.title;
  const mod = modality();
  const subscribers = new Set<(next: CaseState, prev: CaseState) => void>();
  const answered = new Set<FindingId>();
  let stepScope: Scope | null = null;
  let noticeScope: Scope | null = null;
  let hidden = false;

  const dispatch = (e: CaseEvent): void => {
    const next = reduce(state, e);
    if (next === state) return;
    log.push(e);
    save(seed, log.slice(0, BUDGET.maxLoggedEvents), next);
    const prev = state;
    state = next;
    render(prev, next, true);
  };

  const baseCtx = (s: Scope, root: HTMLElement, userInitiated: boolean): StepContext => ({
    root,
    scope: s,
    modality: mod,
    caseNumber: caseNo,
    userInitiated,
    state: () => state,
    subscribe(fn) {
      subscribers.add(fn);
      s.add(() => subscribers.delete(fn));
    },
    dispatch,
    processing: () => s.delay(state.step ? processingMs(seed, state.step) : 0),
    wait: (ms, within = s) => within.delay(Math.max(0, Math.min(ms, BUDGET.climaxMaxMs))),
    announce,
    setHeading(text) {
      els.heading.textContent = text;
    },
    focusHeading() {
      els.heading.focus();
    },
  });

  const mountStep = (id: StepId | 'disposition', userInitiated: boolean): void => {
    stepScope?.dispose();
    const s = new Scope(scope);
    stepScope = s;
    els.body.replaceChildren();
    els.panel.dataset.step = id === 'disposition' ? 'authorized' : id;
    const ctx = baseCtx(s, els.body, userInitiated);
    const run = async (): Promise<void> => {
      if (id === 'disposition') {
        disposition.mount(ctx);
        return;
      }
      const m = await LOADERS[id]();
      if (s.disposed) return;
      const pending = m.mount(ctx);
      if (userInitiated) {
        ctx.focusHeading();
        announce(els.heading.textContent ?? '');
      }
      await pending;
    };
    run().catch((err: unknown) => {
      if (isAbort(err) || s.disposed) return;
      console.error(err);
      if (id !== 'disposition') dispatch({ t: 'SERVICE_UNAVAILABLE', step: id });
    });
  };

  const disposeNotice = (): void => {
    noticeScope?.dispose();
    noticeScope = null;
  };

  const render = (prev: CaseState | null, next: CaseState, userInitiated: boolean): void => {
    const p = phase(next);
    const root = doc.documentElement;
    if (p === 'arrival') root.removeAttribute('data-case');
    else root.setAttribute('data-case', next.authorized ? 'closed' : 'open');
    els.panel.hidden = p === 'arrival';
    els.panel.dataset.live = '';
    if (els.number) els.number.textContent = caseNo;
    if (!hidden) doc.title = titleFor(next, caseNo, arrivalTitle);
    const chip = chipFor(next, caseNo);
    if (els.chip) {
      els.chip.textContent = chip ?? '';
      els.chip.hidden = !chip;
    }

    if (prev) {
      for (const id of newFindings(prev, next)) {
        const line = findingLines[id].status;
        if (!line || answered.has(id)) continue;
        answered.add(id);
        els.status.textContent = line;
      }
    }

    if (p !== 'arrival' || next.noticeDismissed) disposeNotice();

    if (next.authorized) {
      if (!prev?.authorized) mountStep('disposition', userInitiated);
      return;
    }
    if (next.step && next.step !== prev?.step) {
      els.status.textContent = '';
      mountStep(next.step, userInitiated);
      return;
    }
    if (prev) for (const fn of [...subscribers]) fn(next, prev);
  };

  // CTA: the request is intercepted only while the case can still be processed.
  if (els.cta) {
    scope.on(els.cta, 'click', (e) => {
      if (state.authorized || !isPlainActivation(e as MouseEvent)) return;
      try {
        if (!state.opened) dispatch({ t: 'RESUME_REQUESTED', via: 'cta' });
        e.preventDefault();
        if (state.step) els.heading.focus();
      } catch (err) {
        console.error(err); // the link navigates to the résumé
      }
    });
  }
  if (els.expedite) scope.on(els.expedite, 'click', () => dispatch({ t: 'BYPASS_REQUESTED' }));

  installSignals(scope, {
    dispatch,
    onVisibility(isHidden) {
      hidden = isHidden;
      if (phase(state) === 'arrival') return;
      doc.title = isHidden ? hiddenTitle(caseNo) : titleFor(state, caseNo, arrivalTitle);
    },
  });

  render(null, state, false);
  console.info(consoleLine(new URL(url('/resume/'), location.href).href));

  if (new URLSearchParams(location.search).get('mode') === 'recruiter')
    dispatch({ t: 'BYPASS_REQUESTED' });

  if (phase(state) === 'arrival' && !state.noticeDismissed && els.noticeSlot) {
    const ns = new Scope(scope);
    noticeScope = ns;
    const slot = els.noticeSlot;
    ns.timeout(() => notice.mount(baseCtx(ns, slot, false)), BUDGET.noticeAfterMs);
  }

  if (loaded.restored && state.opened && !state.authorized && navigationType() === 'reload')
    dispatch({ t: 'SESSION_RELOADED' });

  return scope;
}

function navigationType(): string {
  const nav = performance.getEntriesByType?.('navigation')[0] as
    PerformanceNavigationTiming | undefined;
  return nav?.type ?? 'navigate';
}
