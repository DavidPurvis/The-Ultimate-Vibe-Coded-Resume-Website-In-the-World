/**
 * Facts only David can supply stay `needs-review` and never render. Flip a record's status to
 * `verified` (and fill its text) and it appears; every section reads fine without it.
 */
import type { ContentStatus } from './types';

export interface PersonalFact {
  id: string;
  label: string;
  text: string;
  status: ContentStatus;
}

export const shown = <T extends { status: ContentStatus; text: string }>(
  r: T | undefined,
): r is T => !!r && r.status !== 'needs-review' && r.text.trim().length > 0;

export const shownAll = <T extends { status: ContentStatus; text: string }>(
  rs: readonly T[],
): T[] => rs.filter((r) => shown(r));
