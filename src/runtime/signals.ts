/**
 * Browser signals → semantic events. The only document- and window-level listeners on the case
 * page. Each adapter decides whether a signal *means* something (a tab switch is one consultation,
 * not two raw events) and discards the raw data: no durations beyond a bucket, no copied text,
 * no coordinates. Under Global Privacy Control or Do Not Track, behavioral observation is off.
 */
import { BUDGET } from '../domain/steps';
import type { CaseEvent, CopyTarget } from '../domain/events';
import type { Scope } from './lifecycle';

export interface SignalDeps {
  dispatch(e: CaseEvent): void;
  /** Tab hidden or shown, for the title artifact. */
  onVisibility(hidden: boolean): void;
  now?: () => number;
}

export function privacySignal(nav: Navigator = navigator): boolean {
  const n = nav as Navigator & { globalPrivacyControl?: boolean };
  return n.globalPrivacyControl === true || n.doNotTrack === '1';
}

const TARGETS = new Set<string>(['contact', 'resume', 'case']);

/** Which part of the page a copy came from: the nearest [data-evidence] block, never the text. */
export function copyTarget(node: Node | null): CopyTarget {
  const el = node instanceof Element ? node : (node?.parentElement ?? null);
  const v = el?.closest<HTMLElement>('[data-evidence]')?.dataset.evidence ?? '';
  return TARGETS.has(v) ? (v as CopyTarget) : 'other';
}

export function installSignals(scope: Scope, deps: SignalDeps): void {
  const now = deps.now ?? (() => performance.now());
  const observe = !privacySignal();

  let hiddenAt: number | null = null;
  scope.on(document, 'visibilitychange', () => {
    const hidden = document.visibilityState === 'hidden';
    deps.onVisibility(hidden);
    if (hidden) {
      hiddenAt = now();
      return;
    }
    if (hiddenAt === null) return;
    const away = now() - hiddenAt;
    hiddenAt = null;
    if (observe)
      deps.dispatch({
        t: 'EXTERNAL_CONSULTATION',
        duration: away >= BUDGET.consultationExtendedMs ? 'extended' : 'brief',
      });
  });

  let lastCopy = Number.NEGATIVE_INFINITY;
  scope.on(document, 'copy', () => {
    if (!observe) return;
    const t = now();
    if (t - lastCopy < BUDGET.copyDebounceMs) return;
    lastCopy = t;
    deps.dispatch({
      t: 'TEXT_COPIED',
      target: copyTarget(document.getSelection()?.anchorNode ?? null),
    });
  });

  // Printing is an entitlement, not behavior: it is honored even when observation is off.
  scope.on(window, 'beforeprint', () => deps.dispatch({ t: 'PRINT_REQUESTED' }));
}
