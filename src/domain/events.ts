/**
 * Semantic events: the only inputs the case understands. They describe the story ("the visitor
 * asked for the résumé again"), never the visitor's physical behaviour. No coordinates, text,
 * timestamps, device data or input modality; parseEvent() rejects anything with extra keys.
 */
import { isStepId, type StepId } from './steps';

export const LANE_CHOICES = ['gen', 'emb', 'plt', 'be', 'unspecified'] as const;
export type LaneChoice = (typeof LANE_CHOICES)[number];

export const COPY_TARGETS = ['contact', 'resume', 'case', 'other'] as const;
export type CopyTarget = (typeof COPY_TARGETS)[number];

export type CaseEvent =
  | { readonly t: 'RESUME_REQUESTED'; readonly via: 'cta' | 'full-document' }
  | { readonly t: 'SCOPE_STATED'; readonly lane: LaneChoice }
  | { readonly t: 'RELEASE_ATTEMPTED' }
  | { readonly t: 'STEP_COMPLETED'; readonly step: 'ceremony' | 'findings' }
  | { readonly t: 'STEP_SKIPPED'; readonly step: 'ceremony' }
  | { readonly t: 'ACKNOWLEDGED' }
  | { readonly t: 'APPEAL_REQUESTED' }
  | { readonly t: 'BYPASS_REQUESTED' }
  | { readonly t: 'NOTICE_DISMISSED' }
  | { readonly t: 'PRINT_REQUESTED' }
  | { readonly t: 'SERVICE_UNAVAILABLE'; readonly step: StepId }
  | { readonly t: 'EXTERNAL_CONSULTATION'; readonly duration: 'brief' | 'extended' }
  | { readonly t: 'TEXT_COPIED'; readonly target: CopyTarget }
  | { readonly t: 'SESSION_RELOADED' };

export type EventType = CaseEvent['t'];

type Rec = Record<string, unknown>;
const oneOf = <T extends string>(v: unknown, allowed: readonly T[]): v is T =>
  typeof v === 'string' && (allowed as readonly string[]).includes(v);
/** Exactly these keys (besides `t`), no more, no fewer. */
const keysAre = (o: Rec, extra: readonly string[]): boolean => {
  const keys = Object.keys(o);
  return keys.length === extra.length + 1 && extra.every((k) => k in o);
};

/** Exact-shape validation for events read back from storage. Anything else is dropped. */
export function parseEvent(x: unknown): CaseEvent | null {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const o = x as Rec;
  switch (o.t) {
    case 'RESUME_REQUESTED':
      return keysAre(o, ['via']) && oneOf(o.via, ['cta', 'full-document'] as const)
        ? { t: o.t, via: o.via }
        : null;
    case 'SCOPE_STATED':
      return keysAre(o, ['lane']) && oneOf(o.lane, LANE_CHOICES) ? { t: o.t, lane: o.lane } : null;
    case 'STEP_COMPLETED':
      return keysAre(o, ['step']) && oneOf(o.step, ['ceremony', 'findings'] as const)
        ? { t: o.t, step: o.step }
        : null;
    case 'STEP_SKIPPED':
      return keysAre(o, ['step']) && o.step === 'ceremony' ? { t: o.t, step: 'ceremony' } : null;
    case 'SERVICE_UNAVAILABLE':
      return keysAre(o, ['step']) && isStepId(o.step) ? { t: o.t, step: o.step } : null;
    case 'EXTERNAL_CONSULTATION':
      return keysAre(o, ['duration']) && oneOf(o.duration, ['brief', 'extended'] as const)
        ? { t: o.t, duration: o.duration }
        : null;
    case 'TEXT_COPIED':
      return keysAre(o, ['target']) && oneOf(o.target, COPY_TARGETS)
        ? { t: o.t, target: o.target }
        : null;
    case 'RELEASE_ATTEMPTED':
    case 'ACKNOWLEDGED':
    case 'APPEAL_REQUESTED':
    case 'BYPASS_REQUESTED':
    case 'NOTICE_DISMISSED':
    case 'PRINT_REQUESTED':
    case 'SESSION_RELOADED':
      return keysAre(o, []) ? { t: o.t } : null;
    default:
      return null;
  }
}
