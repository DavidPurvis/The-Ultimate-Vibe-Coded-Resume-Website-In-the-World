/**
 * The pack's report for each lane: what was selected, what was cut, and why. verify-pdf writes it
 * next to each PDF. Kept apart from the compositions so the case on / never loads it.
 */
import { EMAIL } from './identity';
import type { LaneId, Selection } from './types';

/** How the pack's placeholders were filled in (verify-pdf reports it with each PDF). */
export const PLACEHOLDERS = {
  EMAIL: `${EMAIL} (approved by David)`,
  USERNAME: 'DavidPurvis (confirmed by David)',
  PHONE: 'Omitted by choice',
} as const;

export const SELECTIONS: Record<LaneId, Selection> = {
  gen: {
    selected: [
      'ID (full contact line, no phone)',
      'SUM-GEN',
      'A1 (verb-first, written from the FACT line)',
      'A2 (platform framing)',
      'A3 (SHORT)',
      'A5 (SHORT)',
      'B1 (automation-forward)',
      'C1 (throughput framing)',
      'C2 (as written)',
      'D1',
      'P3 (first sentence, verb-first)',
      'P1 (short framing)',
      'S3',
      'E1',
      'E2',
    ],
    cut: [
      {
        block: 'B5',
        reason:
          'Listed in GEN, but the pack says to cut it when Projects are included (cut-order #2).',
      },
      {
        block: 'A4, A6, A7',
        reason: 'Not part of the GEN composition.',
      },
      {
        block: 'E3, E4, E5, C1–C5 coursework',
        reason: 'GEN composition uses E1+E2 only.',
      },
      {
        block: 'P2, P4',
        reason: 'Not in GEN; shown on the /projects/ Case Files page instead.',
      },
      {
        block: 'P5, P6, P7',
        reason: 'Weakest / unverified projects.',
      },
      {
        block: 'O1–O4',
        reason: 'Optional sections; cut-order #1.',
      },
      {
        block: 'MSU Teaching Assistant',
        reason: 'Pack: incomplete record, never write a bullet.',
      },
    ],
  },
  emb: {
    selected: [
      'ID (full contact line, no phone)',
      'SUM-EMB-SHORT',
      'S2 (coursework-only skills labelled)',
      'E1',
      'E2',
      'E4',
      'Coursework C2 (compressed embedded)',
      'P1 (long framing)',
      'P2 (long framing)',
      'P3 (first sentence, verb-first)',
      'A1 (verb-first, written from the FACT line)',
      'A2 (embedded/reliability framing)',
      'A3 (debugging-forward)',
      'B1 (automation-forward)',
      'C1 (throughput framing)',
      'C2 (as written)',
    ],
    cut: [
      {
        block: 'D1 and the rafting header',
        reason: 'Cut-order #7: the page ran five lines over.',
      },
      {
        block: 'S1',
        reason: 'Compressed to S2 (cut-order #8), after which the page fits.',
      },
      {
        block: 'SUM-EMB',
        reason:
          'Used SUM-EMB-SHORT: the long form lists C and PIC24 assembly beside production work without the coursework label (pack §4).',
      },
      {
        block: 'A4, A5, A6, A7',
        reason: 'Not part of the EMB composition (A5 is weak for EMB).',
      },
      {
        block: 'B2–B5',
        reason: 'Not part of the EMB composition.',
      },
      {
        block: 'E3, E5',
        reason: 'EMB composition uses E1+E2+E4+C2.',
      },
      {
        block: 'P4–P7',
        reason: 'Not in EMB; P4 is on the /projects/ Case Files page.',
      },
      {
        block: 'O1–O4',
        reason: 'Optional sections; cut-order #1.',
      },
      {
        block: 'MSU Teaching Assistant',
        reason: 'Pack: incomplete record, never write a bullet.',
      },
    ],
  },
  plt: {
    selected: [
      'ID (full contact line, no phone)',
      'SUM-PLT',
      'A1 (verb-first, written from the FACT line)',
      'A2 (platform framing)',
      'A3 (migration-forward)',
      'A4 (vendor-neutral)',
      'A6',
      'B1 (automation-forward)',
      'C1 (throughput framing)',
      'C2 (as written)',
      'D1',
      'P3 (first sentence, verb-first)',
      'P2 (short framing)',
      'S3',
      'E1 (degree and honors, no GPA)',
      'E3',
    ],
    cut: [
      {
        block: 'B4',
        reason: 'Cut-order #2: the page ran one line over.',
      },
      {
        block: 'E2 (GPA)',
        reason: 'Pack: drop the GPA for PLT postings.',
      },
      {
        block: 'A5, A7',
        reason: 'Not part of the PLT composition.',
      },
      {
        block: 'B2, B3, B5',
        reason: 'Not part of the PLT composition.',
      },
      {
        block: 'P1, P4–P7',
        reason: 'Not in PLT; P1 and P4 are on the /projects/ Case Files page.',
      },
      {
        block: 'Coursework lines',
        reason: 'Pack: C5, omit coursework when experience fills the page.',
      },
      {
        block: 'O1–O4',
        reason: 'Optional sections; cut-order #1.',
      },
      {
        block: 'MSU Teaching Assistant',
        reason: 'Pack: incomplete record, never write a bullet.',
      },
    ],
  },
  be: {
    selected: [
      'ID (full contact line, no phone)',
      'SUM-BE',
      'A1 (verb-first, written from the FACT line)',
      'A2 (backend framing)',
      'A3 (migration-forward)',
      'IT Support Specialist header only',
      'C1 (robustness framing)',
      'C2 (as written)',
      'D1',
      'P3 (first sentence, verb-first)',
      'P4 (API-inconsistency detail, game unnamed)',
      'S4 (coursework-only languages labelled)',
      'E1',
      'E2',
      'E3',
      'Coursework C4',
    ],
    cut: [
      {
        block: 'B1–B5',
        reason: 'Pack: for BE, keep the IT Support header only.',
      },
      {
        block: 'A4–A7',
        reason: 'Not part of the BE composition.',
      },
      {
        block: 'P1, P2, P5–P7',
        reason: 'Not in BE; P1 and P2 are on the /projects/ Case Files page.',
      },
      {
        block: 'O1–O4',
        reason: 'Optional sections; cut-order #1.',
      },
      {
        block: 'MSU Teaching Assistant',
        reason: 'Pack: incomplete record, never write a bullet.',
      },
    ],
  },
};
