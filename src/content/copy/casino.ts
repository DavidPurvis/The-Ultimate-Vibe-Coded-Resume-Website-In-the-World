/** Link Roulette. */
import type { DestId } from '../types';

export const casinoCopy = {
  kicker: 'FORM DRV-9 · RESOURCE ALLOCATION',
  h1: 'Link Roulette',
  lede: 'Every link on this site is decided by a roulette wheel. The house is rigged. The house is also required, by its own policy, to give you your link by the third spin.',
  picker: 'Please select the information you would like to be prevented from accessing.',
  attempting: (label: string, display: string) =>
    `You are attempting to visit: ${label} (${display}).`,
  oddsSign: [
    'Published odds: 25% each. Actual odds: proprietary.',
    'House edge: 95%. The house is me. I am also the edge.',
  ],
  rulesHeading: 'House rules',
  rules: [
    'Spins are final.',
    'The outcome is decided before the wheel moves (see How This Was Built).',
    'No money is involved. Chips are denominated in recruiter-minutes.',
    'The third spin always pays.',
    'The résumé itself is never on the table.',
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
  outcomes: {
    RICKROLL: {
      title: 'Musical due diligence required.',
      button: 'Proceed to due diligence',
      after: 'Your persistence has been added to the hiring file.',
    },
    RIP: {
      title: 'This link has transitioned to a non-operational lifestyle.',
      engraving: (path: string) => `HERE LIES ${path}`,
      epitaph: 'IT DIED DOING WHAT IT LOVED (REDIRECTING)',
      button: 'Pay respects (F)',
      after: 'F received. Hyperlink revived through community support.',
    },
    HYPERLINK: {
      title: 'Retention policy triggered. The house would like you to read the résumé now.',
      button: (label: string) => `Proceed to ${label}`,
    },
    'DOUBLE OR NOTHING': {
      title: 'You have won the opportunity to continue having an opportunity.',
    },
  },
  sound: { off: 'Sound: off (recommended by the house)', on: 'Sound: on (the house is concerned)' },
  recruiterClosed: 'The house has closed for Recruiter Mode. Your links, unobstructed:',
  noscript: 'The wheel requires JavaScript. The house concedes:',
  responsible: 'Responsible Gambling: If clicking my links has become a problem, call',
  responsibleLink: '1-800-JUST-READ-THE-RESUME',
  wheelLabel: 'Roulette wheel with eight wedges',
  pointerLabel: 'Pointer',
};

export const destCards: Record<DestId, { label: string; blurb: string }> = {
  github: { label: 'GitHub', blurb: 'Code, allegedly.' },
  linkedin: { label: 'LinkedIn', blurb: 'The emotionally unsafe one.' },
  email: { label: 'Email', blurb: 'Direct correspondence. Rigged.' },
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
