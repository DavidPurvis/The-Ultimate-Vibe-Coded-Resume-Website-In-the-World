/**
 * The Access Request pipeline: a fixed, finite sequence of steps (the "interventions") and the
 * budget that bounds them. Changing either is a product decision; tests hold the invariants
 * (total actions, consecutive hostility, skippable climax).
 */
export type StepId = 'scope' | 'preview' | 'release' | 'ceremony' | 'findings' | 'acknowledgment';
export type DelayKind = 'none' | 'processing' | 'climax';

export interface StepSpec {
  /** Spends trust (counts toward the consecutive-hostility limit). */
  readonly hostile: boolean;
  /** Worst-case intent events needed to complete the step. */
  readonly maxActions: number;
  /** Fake wait before the step becomes interactive. */
  readonly delay: DelayKind;
  /** A visible skip control exists. */
  readonly skippable: boolean;
  /** Phase label for the title, chip and heading. */
  readonly label: string;
}

export const PIPELINE = [
  'scope',
  'preview',
  'release',
  'ceremony',
  'findings',
  'acknowledgment',
] as const satisfies readonly StepId[];

export const STEPS: { readonly [K in StepId]: StepSpec } = {
  scope: {
    hostile: true,
    maxActions: 1,
    delay: 'processing',
    skippable: false,
    label: 'Initial review',
  },
  preview: {
    hostile: false,
    maxActions: 1,
    delay: 'none',
    skippable: false,
    label: 'Approved in principle',
  },
  release: {
    hostile: true,
    maxActions: 3,
    delay: 'none',
    skippable: false,
    label: 'Behavioral review',
  },
  ceremony: {
    hostile: true,
    maxActions: 1,
    delay: 'climax',
    skippable: true,
    label: 'Escalation',
  },
  findings: {
    hostile: false,
    maxActions: 1,
    delay: 'processing',
    skippable: false,
    label: 'Preliminary determination',
  },
  acknowledgment: {
    hostile: true,
    maxActions: 3,
    delay: 'none',
    skippable: false,
    label: 'Conditional approval',
  },
};

/** Opening the case (the CTA) is one intent event before the pipeline starts. */
export const OPENING_ACTIONS = 1;

/** Bounded resistance. Timings are hypotheses to be tuned by playtesting, never by chance. */
export const BUDGET = {
  noticeAfterMs: 6000,
  processingMs: { min: 400, max: 1500 },
  climaxMaxMs: 3500,
  maxResisted: 2,
  maxAckScreens: 3,
  maxConsecutiveHostile: 2,
  ambientCap: 3,
  copyDebounceMs: 10_000,
  consultationExtendedMs: 30_000,
  maxLoggedEvents: 64,
} as const;
export type Budget = typeof BUDGET;

export const isStepId = (x: unknown): x is StepId =>
  typeof x === 'string' && (PIPELINE as readonly string[]).includes(x);
