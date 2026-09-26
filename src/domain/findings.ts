/**
 * Findings: what the institution concludes from the session's events. One record per finding,
 * counted rather than repeated. Callbacks may only cite findings recorded before the citing step
 * began, so earlier behaviour returns later as evidence.
 */
import { BUDGET } from './steps';
import type { CaseEvent } from './events';
import type { CaseState } from './case';

export type FindingId =
  | 'REPEATED_REQUEST'
  | 'PERSISTENCE'
  | 'EXTERNAL_CONSULTATION'
  | 'EXTRACTION'
  | 'CASE_CONTINUITY'
  | 'ACKNOWLEDGMENT_DECLINED'
  | 'CEREMONY_DECLINED';

export interface FindingRecord {
  readonly count: number;
  /** CaseState.index of the event that first recorded it. */
  readonly firstAt: number;
}

export type Findings = { readonly [K in FindingId]?: FindingRecord };

/** Surfaces that cite earlier findings. (Immediate status-line responses are not callbacks.) */
export type Surface = 'ceremony' | 'findings' | 'disposition';

/** Findings from ambient signals are capped; the rest are bounded by the pipeline itself. */
const AMBIENT: readonly FindingId[] = ['EXTERNAL_CONSULTATION', 'EXTRACTION', 'CASE_CONTINUITY'];

/** Returns a new findings map with `id` counted once more, or the same map when capped. */
export function bump(f: Findings, id: FindingId, at: number): Findings {
  const cur = f[id];
  if (cur && AMBIENT.includes(id) && cur.count >= BUDGET.ambientCap) return f;
  return { ...f, [id]: { count: (cur?.count ?? 0) + 1, firstAt: cur?.firstAt ?? at } };
}

/**
 * Evidence rules (transition rows 17–18). Returns `s` unchanged when the event is not evidence,
 * is out of place, or is over its cap.
 */
export function applyEvidence(s: CaseState, e: CaseEvent): CaseState {
  let id: FindingId | null = null;
  switch (e.t) {
    case 'NOTICE_DISMISSED':
      if (!s.opened && !s.noticeDismissed) id = 'ACKNOWLEDGMENT_DECLINED';
      break;
    case 'TEXT_COPIED':
      id = 'EXTRACTION';
      break;
    case 'EXTERNAL_CONSULTATION':
      if (s.opened) id = 'EXTERNAL_CONSULTATION';
      break;
    case 'SESSION_RELOADED':
      if (s.opened) id = 'CASE_CONTINUITY';
      break;
    default:
      break;
  }
  if (!id) return s;
  const findings = bump(s.findings, id, s.index);
  if (findings === s.findings) return s;
  return {
    ...s,
    index: s.index + 1,
    findings,
    noticeDismissed: s.noticeDismissed || e.t === 'NOTICE_DISMISSED',
  };
}

const ORDER: readonly FindingId[] = [
  'REPEATED_REQUEST',
  'PERSISTENCE',
  'EXTERNAL_CONSULTATION',
  'EXTRACTION',
  'ACKNOWLEDGMENT_DECLINED',
  'CEREMONY_DECLINED',
  'CASE_CONTINUITY',
];
const CAPS: Record<Surface, number> = { ceremony: 3, findings: 4, disposition: 5 };

/** Findings a surface may cite: recorded strictly before the current step began. */
export function selectCallbacks(s: CaseState, surface: Surface): readonly FindingId[] {
  return ORDER.filter((id) => {
    const r = s.findings[id];
    return r !== undefined && r.firstAt < s.enteredAt;
  }).slice(0, CAPS[surface]);
}

/** Findings that `next` has and `prev` did not: the status line answers these once. */
export function newFindings(prev: CaseState, next: CaseState): readonly FindingId[] {
  return ORDER.filter((id) => next.findings[id] !== undefined && prev.findings[id] === undefined);
}
