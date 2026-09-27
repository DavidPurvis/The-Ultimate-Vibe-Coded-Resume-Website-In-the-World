/**
 * The case: one pure reducer over the fixed pipeline. This function *is* the policy. Its clauses
 * run in a fixed order: terminal guard → entitlement overrides → progress → resistance →
 * evidence → no-op. An ignored event returns the same reference and is never logged, so a replayed
 * log contains only events that changed something. Nothing here reads randomness or modality.
 */
import { BUDGET, type StepId } from './steps';
import type { CaseEvent, LaneChoice } from './events';
import { applyEvidence, bump, type Findings } from './findings';

export type AuthorizationRoute =
  'adjudicated' | 'appeal-reconciled' | 'expedited' | 'print-amnesty' | 'default-approval';

export interface CaseState {
  readonly seed: number;
  /** Accepted events so far ("events processed"). */
  readonly index: number;
  /** The first résumé request has been received. */
  readonly opened: boolean;
  /** null in arrival (not opened) and once authorized. */
  readonly step: StepId | null;
  /** index of the event that entered the current step (or authorized). */
  readonly enteredAt: number;
  readonly authorized: { readonly via: AuthorizationRoute } | null;
  readonly lane: LaneChoice | null;
  readonly requests: number;
  readonly resisted: number;
  readonly ack: 'pending' | 'acknowledged' | 'appealed';
  readonly noticeDismissed: boolean;
  readonly findings: Findings;
}

export type Phase = 'arrival' | StepId | 'authorized';

export function initialCase(seed: number): CaseState {
  return {
    seed,
    index: 0,
    opened: false,
    step: null,
    enteredAt: 0,
    authorized: null,
    lane: null,
    requests: 0,
    resisted: 0,
    ack: 'pending',
    noticeDismissed: false,
    findings: {},
  };
}

export function phase(s: CaseState): Phase {
  if (s.authorized) return 'authorized';
  return s.step ?? 'arrival';
}

type Patch = Partial<Omit<CaseState, 'seed' | 'index'>>;
const accept = (s: CaseState, patch: Patch): CaseState => ({ ...s, ...patch, index: s.index + 1 });
const enter = (s: CaseState, step: StepId, patch: Patch = {}): CaseState =>
  accept(s, { ...patch, step, enteredAt: s.index });
const authorize = (s: CaseState, via: AuthorizationRoute): CaseState =>
  accept(s, { step: null, enteredAt: s.index, authorized: { via } });

/** Progress and resistance rules (rows 5–16). null when no rule matches. */
function progress(s: CaseState, e: CaseEvent): CaseState | null {
  if (!s.opened) {
    return e.t === 'RESUME_REQUESTED' && e.via === 'cta'
      ? enter(s, 'scope', { opened: true, requests: 1 })
      : null;
  }
  switch (s.step) {
    case 'scope':
      return e.t === 'SCOPE_STATED' ? enter(s, 'preview', { lane: e.lane }) : null;
    case 'preview':
      return e.t === 'RESUME_REQUESTED' && e.via === 'full-document'
        ? enter(s, 'release', {
            requests: s.requests + 1,
            findings: bump(s.findings, 'REPEATED_REQUEST', s.index),
          })
        : null;
    case 'release':
      if (e.t !== 'RELEASE_ATTEMPTED') return null;
      return s.resisted < BUDGET.maxResisted
        ? accept(s, {
            resisted: s.resisted + 1,
            findings: bump(s.findings, 'PERSISTENCE', s.index),
          })
        : enter(s, 'ceremony');
    case 'ceremony':
      if (e.t === 'STEP_COMPLETED' && e.step === 'ceremony') return enter(s, 'findings');
      if (e.t === 'STEP_SKIPPED' && e.step === 'ceremony')
        return enter(s, 'findings', {
          findings: bump(s.findings, 'CEREMONY_DECLINED', s.index),
        });
      return null;
    case 'findings':
      return e.t === 'STEP_COMPLETED' && e.step === 'findings'
        ? enter(s, 'acknowledgment', { ack: 'pending' })
        : null;
    case 'acknowledgment':
      if (e.t === 'APPEAL_REQUESTED')
        return s.ack === 'appealed' ? null : accept(s, { ack: 'appealed' });
      if (e.t !== 'ACKNOWLEDGED') return null;
      if (s.ack === 'pending') return accept(s, { ack: 'acknowledged' });
      return authorize(s, s.ack === 'appealed' ? 'appeal-reconciled' : 'adjudicated');
    default:
      return null;
  }
}

export function reduce(s: CaseState, e: CaseEvent): CaseState {
  if (s.authorized) return s;
  switch (e.t) {
    case 'BYPASS_REQUESTED':
      return authorize(s, 'expedited');
    case 'PRINT_REQUESTED':
      return authorize(s, 'print-amnesty');
    case 'SERVICE_UNAVAILABLE':
      return authorize(s, 'default-approval');
    default:
      return progress(s, e) ?? applyEvidence(s, e);
  }
}

/** Fold a log. `accepted` is the canonical log: the events that changed the state. */
export function replay(
  seed: number,
  events: readonly CaseEvent[],
): { state: CaseState; accepted: CaseEvent[] } {
  let state = initialCase(seed);
  const accepted: CaseEvent[] = [];
  for (const e of events) {
    const next = reduce(state, e);
    if (next !== state) {
      accepted.push(e);
      state = next;
    }
  }
  return { state, accepted };
}

/** The cooperative events that reach authorization from `s` (the progress proof). */
export function progressPath(s: CaseState): CaseEvent[] {
  const path: CaseEvent[] = [];
  let cur = s;
  while (!cur.authorized) {
    const e = cooperative(cur);
    const next = reduce(cur, e);
    if (next === cur) throw new Error(`no progress from ${phase(cur)}`);
    path.push(e);
    cur = next;
  }
  return path;
}

function cooperative(s: CaseState): CaseEvent {
  switch (phase(s)) {
    case 'arrival':
      return { t: 'RESUME_REQUESTED', via: 'cta' };
    case 'scope':
      return { t: 'SCOPE_STATED', lane: 'unspecified' };
    case 'preview':
      return { t: 'RESUME_REQUESTED', via: 'full-document' };
    case 'release':
      return { t: 'RELEASE_ATTEMPTED' };
    case 'ceremony':
      return { t: 'STEP_COMPLETED', step: 'ceremony' };
    case 'findings':
      return { t: 'STEP_COMPLETED', step: 'findings' };
    default:
      return { t: 'ACKNOWLEDGED' };
  }
}
