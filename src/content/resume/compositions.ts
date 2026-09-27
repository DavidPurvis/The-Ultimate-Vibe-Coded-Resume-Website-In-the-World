/**
 * Compositions: the Résumé Context Pack's "recommended composition by lane", as data. A lane lists
 * framing IDs; resolve.ts turns it into the render model (selections.ts holds the pack's report of
 * what was selected and cut, and why).
 *
 * Coursework-only skills (C, Java, assembly, microcontroller peripherals) are labelled
 * "(coursework)" wherever they sit outside Education.
 */
import type { Composition, LaneId } from './types';

const GEN_ORDER = ['summary', 'experience', 'projects', 'skills', 'education'] as const;
const S3 = [
  { label: 'Languages', framing: 'S3:gen:languages' },
  { label: 'Infrastructure', framing: 'S3:gen:infrastructure' },
  { label: 'Platforms', framing: 'S3:gen:platforms' },
  { label: 'Practices', framing: 'S3:gen:practices' },
] as const;

export const COMPOSITIONS: Record<LaneId, Composition> = {
  gen: {
    lane: 'gen',
    order: GEN_ORDER,
    summary: 'SUM-GEN:gen',
    roles: [
      { role: 'aspen-sfa', bullets: ['A1:gen', 'A2:gen', 'A3:gen', 'A5:gen'] },
      { role: 'aspen-it', bullets: ['B1:gen'] },
      { role: 'rafting', bullets: ['D1:gen'] },
      { role: 'cspire', bullets: ['C1:gen', 'C2:gen'] },
    ],
    projects: [
      { project: 'P3', bullets: ['P3:gen'] },
      { project: 'P1', bullets: ['P1:gen'] },
    ],
    skills: S3,
    education: [
      { fact: 'E1', variant: 'full', notes: [] },
      { fact: 'E2', variant: 'full', notes: [] },
    ],
  },

  emb: {
    lane: 'emb',
    // Pack: education sits high because the ECE sequence is the credential the work history lacks.
    order: ['summary', 'skills', 'education', 'projects', 'experience'],
    summary: 'SUM-EMB-SHORT:emb',
    // S2 (cut-order #8: S1 ran the page over), with coursework-only skills labelled.
    skills: [
      { label: 'Languages', framing: 'S2:emb:languages' },
      { label: 'Embedded & Systems', framing: 'S2:emb:embedded-systems' },
      { label: 'Practices', framing: 'S2:emb:practices' },
    ],
    education: [
      { fact: 'E1', variant: 'full', notes: [] },
      { fact: 'E2', variant: 'full', notes: ['E4:emb', 'CW2:emb'] },
    ],
    projects: [
      { project: 'P1', bullets: ['P1:emb'] },
      { project: 'P2', bullets: ['P2:emb'] },
      { project: 'P3', bullets: ['P3:gen'] },
    ],
    roles: [
      { role: 'aspen-sfa', bullets: ['A1:gen', 'A2:emb', 'A3:emb'] },
      { role: 'aspen-it', bullets: ['B1:gen'] },
      { role: 'cspire', bullets: ['C1:gen', 'C2:gen'] },
    ],
  },

  plt: {
    lane: 'plt',
    order: GEN_ORDER,
    summary: 'SUM-PLT:plt',
    roles: [
      { role: 'aspen-sfa', bullets: ['A1:gen', 'A2:gen', 'A3:plt', 'A4:plt', 'A6:plt'] },
      { role: 'aspen-it', bullets: ['B1:gen'] },
      { role: 'rafting', bullets: ['D1:gen'] },
      { role: 'cspire', bullets: ['C1:gen', 'C2:gen'] },
    ],
    projects: [
      { project: 'P3', bullets: ['P3:gen'] },
      { project: 'P2', bullets: ['P2:plt'] },
    ],
    skills: S3,
    // Pack: drop the GPA for PLT postings.
    education: [
      { fact: 'E1', variant: 'full', notes: ['E3:plt'] },
      { fact: 'E2', variant: 'no-gpa', notes: [] },
    ],
  },

  be: {
    lane: 'be',
    order: GEN_ORDER,
    summary: 'SUM-BE:be',
    roles: [
      { role: 'aspen-sfa', bullets: ['A1:gen', 'A2:be', 'A3:plt'] },
      // Pack: for BE, keep only the IT Support header for continuity.
      { role: 'aspen-it', bullets: [] },
      { role: 'rafting', bullets: ['D1:gen'] },
      { role: 'cspire', bullets: ['C1:be', 'C2:gen'] },
    ],
    projects: [
      { project: 'P3', bullets: ['P3:gen'] },
      { project: 'P4', bullets: ['P4:be'] },
    ],
    skills: [
      { label: 'Languages', framing: 'S4:be:languages' },
      { label: 'Backend', framing: 'S4:be:backend' },
      { label: 'Infrastructure', framing: 'S4:be:infrastructure' },
    ],
    education: [
      { fact: 'E1', variant: 'full', notes: ['E3:plt'] },
      { fact: 'E2', variant: 'full', notes: ['CW4:be'] },
    ],
  },
};
