/**
 * The ceremony: eleven services review one bullet of the résumé. Every row has a plain-language
 * verdict; rows that cite something the visitor did earlier say so in their own words (the same
 * finding never repeats word for word across surfaces).
 */
import type { ServiceId } from '../../domain/assessment';
import { credentials } from './credentials';

export const ceremony = {
  heading: 'Escalated review',
  body: 'Your request has been escalated to eleven independent services. Each will review the same bullet from the résumé.',
  subject: 'Bullet under review',
  caption: 'Service review',
  columns: { service: 'Service', verdict: 'Verdict', time: 'Time' },
  pending: 'Pending',
  ms: (n: number) => `${n} ms`,
  skip: 'Skip ceremony',
  continue: 'Continue',
  result: 'All eleven services concur: the bullet is accurate. It was accurate before the review.',
  motion: 'Motion preference honored. Motion-based obstruction has been replaced with paperwork.',
};

interface Service {
  readonly name: string;
  readonly verdict: string;
  /** The verdict when the row cites a finding recorded earlier in the session. */
  readonly cited?: string;
}

const WEEKDAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
] as const;

/** The jurisdiction row's verdict depends on the day the request was filed (never stored). */
export const jurisdiction = (day: number) =>
  `Filed on a ${WEEKDAYS[day] ?? 'weekday'}. Within jurisdiction.`;

export const services: Record<ServiceId, Service> = {
  intake: {
    name: 'Intake',
    verdict: 'Request received.',
    cited: 'Request received. Previously received.',
  },
  confidentiality: {
    name: 'Confidentiality review',
    verdict: 'Document is public. Confidentiality not applicable.',
  },
  persistence: {
    name: 'Persistence audit',
    verdict: 'No persistence on file.',
    cited: 'Visitor was reassigned and returned. Noted favorably.',
  },
  plausibility: { name: 'Plausibility check', verdict: 'Visitor is probably human.' },
  consultation: {
    name: 'Consultation registry',
    verdict: 'No outside consultation on file.',
    cited: 'Visitor left to consult other sources and came back.',
  },
  jurisdiction: { name: 'Jurisdiction', verdict: 'Within jurisdiction.' },
  'bullet-review': { name: 'Bullet review', verdict: 'Every number matches the record.' },
  'status-inversion': {
    name: 'Credential check',
    verdict: `Candidate is an ${credentials.minister.title}, ${credentials.minister.tenure.toLowerCase()}. Reviewer is not.`,
  },
  'policy-compiler': {
    name: 'Policy compiler',
    verdict: 'Policy compiled. It permits the request.',
  },
  overreaction: {
    name: 'Proportionality review',
    verdict: 'Response found disproportionate. Response continued.',
  },
  'decision-point': { name: 'Decision', verdict: 'Approved.' },
};
