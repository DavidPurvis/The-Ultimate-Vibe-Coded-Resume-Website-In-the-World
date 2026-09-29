/**
 * The case record: finite IDs, defaults, validation and the reducer. Pure data, no copy and no
 * DOM, so storage can import it without pulling any prose into shared JavaScript.
 */

/** Every destination that counts as a department visit (homepage = intake). */
export const DEPARTMENT_IDS = [
  'intake',
  'verification',
  'character-review',
  'personnel',
  'skills',
  'projects',
  'newsletter',
  'resume-selection',
  'correspondence',
  'allocation',
  'beliefs',
  'causes',
  'wishlist',
  'statements',
  'data-sale',
  'confession',
  'doom',
  'cube',
  'presentation',
  'music',
] as const;
export type DepartmentId = (typeof DEPARTMENT_IDS)[number];

/** Contextual notices, each issued at most once per session. */
export const NOTICE_IDS = [
  'classification-withheld',
  'inspection-absent',
  'allocation-unsuccessful',
  'appendix-reviewed',
  'cookie-invitation',
] as const;
export type NoticeId = (typeof NOTICE_IDS)[number];

export interface CaseFile {
  departments: DepartmentId[];
  issuedNotices: NoticeId[];
  /** Future résumé requests this session skip the release procedure. Nothing else. */
  released: boolean;
}

export const emptyCaseFile = (): CaseFile => ({
  departments: [],
  issuedNotices: [],
  released: false,
});

export const isDepartmentId = (x: unknown): x is DepartmentId =>
  typeof x === 'string' && (DEPARTMENT_IDS as readonly string[]).includes(x);
export const isNoticeId = (x: unknown): x is NoticeId =>
  typeof x === 'string' && (NOTICE_IDS as readonly string[]).includes(x);

/** Known IDs only, each once, in first-seen order. */
function ids<T>(v: unknown, guard: (x: unknown) => x is T): T[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.filter(guard))];
}

/** Old, partial or malformed records become safe values without discarding what is valid. */
export function validateCaseFile(v: unknown): CaseFile {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return emptyCaseFile();
  const o = v as Record<string, unknown>;
  return {
    departments: ids(o.departments, isDepartmentId),
    issuedNotices: ids(o.issuedNotices, isNoticeId),
    released: o.released === true,
  };
}

export type CaseAction =
  { t: 'visit'; department: DepartmentId } | { t: 'notice'; id: NoticeId } | { t: 'release' };

/** Returns the same object when nothing changes, so callers can skip the write. */
export function reduceCase(s: CaseFile, a: CaseAction): CaseFile {
  switch (a.t) {
    case 'visit':
      return s.departments.includes(a.department)
        ? s
        : { ...s, departments: [...s.departments, a.department] };
    case 'notice':
      return s.issuedNotices.includes(a.id)
        ? s
        : { ...s, issuedNotices: [...s.issuedNotices, a.id] };
    case 'release':
      return s.released ? s : { ...s, released: true };
  }
}
