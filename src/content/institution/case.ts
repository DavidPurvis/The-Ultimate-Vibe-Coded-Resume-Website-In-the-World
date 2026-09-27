/**
 * The Access Request, in the Department's own words. Everything here is fiction (status
 * 'fictional'): the institution is completely serious about itself and never winks. Rules
 * (voice.test): no exclamation marks, no meme words, notices ≤ 25 words, step bodies ≤ 45 words.
 */
import type { LaneChoice } from '../../domain/events';
import type { AuthorizationRoute } from '../../domain/case';
import type { FindingId } from '../../domain/findings';

export const DEPARTMENT = 'Department of Recruiter Verification';

export const panel = {
  label: DEPARTMENT,
  caseLabel: 'Case',
  expedite: 'Request expedited processing',
  direct: 'Open the résumé directly',
  directNote: 'Direct access is not subject to review.',
  /** Shown if the page's scripts never start (the static panel): fail open. */
  staticHeading: 'Case in progress',
  staticBody:
    'Automated review is unavailable in this browser session. Your request is therefore approved.',
  received: (caseNo: string) => `Request received. ${caseNo}.`,
};

/** One line in the browser console on `/`, once per page load. */
export const consoleLine = (resumeUrl: string) =>
  `${DEPARTMENT}. This session is subject to routine review. The résumé is at ${resumeUrl}`;

export const notice = {
  text: 'A routine review of this session has been scheduled. No action is required.',
  dismiss: 'Dismiss',
};

export const dispositionCopy = {
  heading: 'Case closed',
  stamp: 'Approved',
  stampAppeal: 'Original decision also approved',
  summary: 'Resolution: visitor obtained document linked from homepage.',
  route: {
    adjudicated: 'Disposition: access granted after adjudication.',
    'appeal-reconciled': 'Disposition: access granted on appeal, which was unnecessary.',
    expedited: 'Disposition: expedited processing approved. It was always available.',
    'print-amnesty':
      'Disposition: print request received. Institutional control of printed matter has lapsed.',
    'default-approval':
      'Disposition: obstruction service unavailable. Your résumé access request has therefore been approved by default.',
  } satisfies Record<AuthorizationRoute, string>,
  scope: (label: string) => `Stated scope: ${label}.`,
  resistance: (used: number, permitted: number) =>
    `Release attempts resisted: ${used} of ${permitted} permitted.`,
  open: 'Open résumé',
  openFor: (label: string) => `Open résumé (${label})`,
  formats: 'Other formats',
  pdf: 'PDF',
  markdown: 'Markdown',
  announce: 'Case closed. Access granted.',
};

/** How each finding reads on each surface. The same finding never repeats word for word. */
export const findingLines: Record<
  FindingId,
  { status?: string; findings: (n: number) => string; disposition: (n: number) => string }
> = {
  REPEATED_REQUEST: {
    findings: () => 'Repeated selection of “View résumé.”',
    disposition: (n) => `Résumé requests on file: ${n + 1}.`,
  },
  PERSISTENCE: {
    findings: (n) =>
      `Persistence: ${n} release ${n === 1 ? 'attempt' : 'attempts'} after reassignment.`,
    disposition: (n) =>
      `Persistence was recorded ${n === 1 ? 'once' : `${n} times`} and has been commended.`,
  },
  EXTERNAL_CONSULTATION: {
    status: 'External consultation has been noted.',
    findings: (n) => `External consultation detected (${n}).`,
    disposition: (n) =>
      `The visitor consulted outside sources ${n === 1 ? 'once' : `${n} times`}. The Department was not consulted.`,
  },
  EXTRACTION: {
    status:
      'Clipboard activity detected. No response was necessary. We simply wanted this recorded.',
    findings: (n) => `Extraction behavior: ${n} clipboard ${n === 1 ? 'event' : 'events'}.`,
    disposition: () => 'Clipboard activity: recorded. No response was necessary.',
  },
  CASE_CONTINUITY: {
    status: 'Case continuity confirmed. This case survived a refresh.',
    findings: (n) => `Case continuity: survived ${n === 1 ? 'one refresh' : `${n} refreshes`}.`,
    disposition: () => 'Refreshing did not close the case. Nothing does, except this.',
  },
  ACKNOWLEDGMENT_DECLINED: {
    findings: () => 'Routine review notice: acknowledgment declined.',
    disposition: () => 'The routine review notice was dismissed. The review happened anyway.',
  },
  CEREMONY_DECLINED: {
    findings: () => 'Ceremonial review: declined by visitor.',
    disposition: () => 'The ceremony was skipped. Its conclusions were unchanged.',
  },
};

export const laneLabels: Record<LaneChoice, string> = {
  emb: 'Embedded software',
  plt: 'Platform / SRE',
  be: 'Backend',
  gen: 'General software engineering',
  unspecified: 'PDF, as previously advised',
};

export const titles = {
  open: (caseNo: string, label: string) => `Case ${caseNo} · ${label} — David Purvis`,
  hidden: (caseNo: string) => `Case ${caseNo} · Awaiting your return`,
  closed: 'Case closed — David Purvis',
  chip: (caseNo: string, label: string) => `Case ${caseNo} · ${label}`,
  chipClosed: 'Case closed',
};
