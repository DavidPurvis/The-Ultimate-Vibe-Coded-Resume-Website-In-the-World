/** Hyperlink allocation: every destination is available; allocation is pending. */
import type { DestId } from '../types';

export const casinoCopy = {
  kicker: 'Form DDP-9 · Correspondence · Hyperlink allocation',
  h1: 'Hyperlink Allocation',
  lede: 'Links to David’s GitHub, LinkedIn, email and résumé PDF are allocated by wheel. Every destination is available. Allocation is completed no later than the third request.',
  picker: 'Please select the information you would like to be prevented from accessing.',
  attempting: (label: string, display: string) =>
    `The requested destination is available. Allocation is pending. Requested: ${label} (${display}).`,
  oddsSign: [
    'Published odds: 25% each. Actual odds: proprietary.',
    'Processing fee: one recruiter-minute per request.',
  ],
  rulesHeading: 'Allocation rules',
  rules: [
    'Allocations are final.',
    'The outcome is determined before the wheel moves (see How it was built).',
    'No money is involved. Chips are denominated in recruiter-minutes.',
    'Allocation is completed no later than the third request.',
    'The résumé itself is never allocated by wheel.',
  ],
  chips: [
    { value: 1, label: 'Recruiter-Minute', color: 'cream' },
    { value: 5, label: 'Hiring-Manager Sighs', color: 'red' },
    { value: 25, label: 'Headcount Approvals', color: 'black' },
  ] as const,
  spin: 'Place chip & spin',
  spinAgain: 'Spin again',
  accepted: 'Your recruiter-minute has been accepted. Refunds are conceptual.',
  spinning: 'Allocating hyperlinks according to market conditions…',
  attempt: (n: number, label: string) => `Attempt ${n} for ${label}.`,
  resultAnnounce: (outcome: string) => `Result: ${outcome}.`,
  /** Every unsuccessful allocation says this first; the outcome's own line follows. */
  pending: 'Your request remains within the processing period.',
  outcomes: {
    RICKROLL: {
      title: 'Musical material must be reviewed before allocation.',
      button: 'Review the musical material',
      after: 'Your persistence has been added to the file.',
    },
    RIP: {
      title: 'This link has transitioned to a non-operational lifestyle.',
      engraving: (path: string) => `HERE LIES ${path}`,
      epitaph: 'IT DIED DOING WHAT IT LOVED (REDIRECTING)',
      button: 'Pay respects (F)',
      after: 'F received. Hyperlink revived through community support.',
    },
    HYPERLINK: {
      title: 'Allocation complete.',
      button: (label: string) => `Open ${label}`,
    },
    'DOUBLE OR NOTHING': {
      title: 'You have been allocated the opportunity to continue having an opportunity.',
    },
  },
  sound: { off: 'Sound: off', on: 'Sound: on' },
  recruiterClosed: 'Direct access is on. Every destination, without allocation:',
  noscript: 'Allocation requires JavaScript. Every destination, without allocation:',
  responsible: 'Responsible Gambling: If clicking my links has become a problem, call',
  responsibleLink: '1-800-JUST-READ-THE-RESUME',
  wheelLabel: 'Roulette wheel with eight wedges',
  pointerLabel: 'Pointer',
};

export const destCards: Record<DestId, { label: string; blurb: string }> = {
  github: { label: 'GitHub', blurb: 'Code, allegedly.' },
  linkedin: { label: 'LinkedIn', blurb: 'The emotionally unsafe one.' },
  email: { label: 'Email', blurb: 'Direct correspondence.' },
  pdf: { label: 'Résumé PDF', blurb: 'One page. Earned.' },
  repo: { label: 'This website’s source code', blurb: 'Even this link.' },
};

export const WEDGES = [
  'RICKROLL',
  'RIP',
  'HYPERLINK',
  'DOUBLE OR NOTHING',
  'RICKROLL',
  'RIP',
  'HYPERLINK',
  'RICKROLL',
] as const;
