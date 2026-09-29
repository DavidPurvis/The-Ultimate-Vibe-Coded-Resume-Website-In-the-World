/**
 * The case record, as the Department words it. Keyed by the IDs in src/case/state.ts; a unit test
 * checks every ID has copy. Storage never imports this file.
 */
import type { NoticeId } from '../../case/state';
import type { ReleaseSummary, StatusTier } from '../../case/policy';

export const status: Readonly<Record<StatusTier, string>> = {
  0: 'Request received.',
  1: 'Your file has been circulated.',
  2: 'Additional interest has been referred for review.',
};

export const statusLabel = 'Case status';

export const notices: Readonly<Record<NoticeId, string>> = {
  'classification-withheld': 'Classification withheld. Classification requirement satisfied.',
  'inspection-absent': 'Inspection completed in the absence of inspection.',
  'allocation-unsuccessful': 'Previous allocation unsuccessful. Continued interest noted.',
  'appendix-reviewed': 'Visitor has reviewed material removed from circulation.',
  'cookie-invitation': 'A cookie preference remains outstanding.',
};

export const noticeLabel = 'Notice';
export const cookieInvitation = {
  open: 'Review cookie preferences',
  dismiss: 'Not now',
};

export const release = {
  title: 'Résumé release',
  request: {
    heading: 'Résumé request',
    body: 'You are requesting David Purvis’s résumé.',
    action: 'Confirm request',
  },
  confirm: {
    heading: 'Request confirmation',
    body: 'Please confirm that your previous confirmation concerned this document.',
    action: 'Confirm',
  },
  determination: {
    heading: 'Determination',
    approved: 'Approved.',
    action: 'Open résumé',
  },
  direct: 'Go directly to résumé',
  close: 'Close',
};

/** One short summary of what the visitor actually did. Never inferred from time or absence. */
export function determinationSummary(s: ReleaseSummary): string {
  const parts: string[] = [
    s.departments === 0
      ? 'No departments consulted.'
      : s.departments === 1
        ? 'One department consulted.'
        : `${s.departments} departments consulted.`,
  ];
  if (s.classification === 'human') parts.push('Classification: human, as declared.');
  if (s.classification === 'automated')
    parts.push('Classification: automated system, as declared.');
  if (s.classification === 'withheld') parts.push('Classification: withheld.');
  if (s.verification === 'complete') parts.push('Verification: review complete.');
  if (s.verification === 'skipped') parts.push('Verification: skipped.');
  if (s.allocationLosses > 0)
    parts.push(
      s.allocationLosses === 1
        ? 'One unsuccessful allocation on file.'
        : `${s.allocationLosses} unsuccessful allocations on file.`,
    );
  if (s.appendixOpened) parts.push('Removed material: reviewed.');
  if (!s.supported) parts.push('No supporting declarations were supplied.');
  return parts.join(' ');
}
