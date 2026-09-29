/**
 * Case policy: which page is which department, what the status line says, which single notice a
 * page may show, and what the release determination may cite. Pure functions of recorded facts;
 * nothing here unlocks content, starts a scene or changes any odds.
 */
import type { CaseFile, DepartmentId, NoticeId } from './state';

export type CategoryId =
  | 'visitor-services'
  | 'records'
  | 'correspondence'
  | 'public-affairs'
  | 'recreation'
  | 'facilities';

/** Canonical root-relative route → department. Routes not listed never count. */
const ROUTE_DEPARTMENTS: Readonly<Record<string, DepartmentId>> = {
  '/': 'intake',
  '/verify/': 'verification',
  '/about/': 'character-review',
  '/personnel-file/': 'personnel',
  '/skills/': 'skills',
  '/projects/': 'projects',
  '/blog/': 'newsletter',
  '/tailor/': 'resume-selection',
  '/contact/': 'correspondence',
  '/casino/': 'allocation',
  '/beliefs/': 'beliefs',
  '/support/': 'causes',
  '/wishlist/': 'wishlist',
  '/nintendo/': 'statements',
  '/sell-your-data/': 'data-sale',
  '/confess/': 'confession',
  '/doom/': 'doom',
  '/cube/': 'cube',
  '/presentation/': 'presentation',
  '/rick/': 'music',
};

export const CATEGORY_OF: Readonly<Record<DepartmentId, CategoryId>> = {
  intake: 'visitor-services',
  verification: 'visitor-services',
  'character-review': 'records',
  personnel: 'records',
  skills: 'records',
  projects: 'records',
  newsletter: 'records',
  'resume-selection': 'records',
  correspondence: 'correspondence',
  allocation: 'correspondence',
  beliefs: 'public-affairs',
  causes: 'public-affairs',
  wishlist: 'public-affairs',
  statements: 'public-affairs',
  'data-sale': 'public-affairs',
  confession: 'public-affairs',
  doom: 'recreation',
  cube: 'recreation',
  presentation: 'recreation',
  music: 'recreation',
};

/**
 * A pathname as the browser reports it (possibly under the GitHub Pages base path, possibly with
 * index.html, a query or a fragment) → the canonical root-relative route the pages declare.
 */
export function canonicalRoute(pathname: string, base = ''): string {
  let p = (pathname.split(/[?#]/)[0] ?? '').replace(/index\.html$/, '');
  const b = base.replace(/\/$/, '');
  if (b && (p === b || p.startsWith(`${b}/`))) p = p.slice(b.length);
  if (!p.startsWith('/')) p = `/${p}`;
  if (!p.endsWith('/') && !/\.[a-z0-9]+$/i.test(p)) p = `${p}/`;
  return p;
}

/** The department a canonical route belongs to; every newsletter page is one department. */
export function departmentOf(route: string): DepartmentId | null {
  if (route.startsWith('/blog/')) return 'newsletter';
  return ROUTE_DEPARTMENTS[route] ?? null;
}

/** 0: "Request received." 1: "Your file has been circulated." 2: "…referred for review." */
export type StatusTier = 0 | 1 | 2;
export function statusTier(departmentsConsulted: number): StatusTier {
  if (departmentsConsulted >= 4) return 2;
  if (departmentsConsulted >= 2) return 1;
  return 0;
}

/** What the visitor actually did, as recorded. Never inferred from time or from absence. */
export interface Evidence {
  classification: 'human' | 'automated' | 'withheld' | null;
  verification: 'complete' | 'skipped' | null;
  allocationLosses: number;
  appendixOpened: boolean;
  cookiePending: boolean;
}

const CALLBACKS: readonly {
  id: NoticeId;
  applies: (e: Evidence) => boolean;
  contexts: readonly CategoryId[];
}[] = [
  {
    id: 'classification-withheld',
    applies: (e) => e.classification === 'withheld',
    contexts: ['visitor-services', 'records'],
  },
  {
    id: 'inspection-absent',
    applies: (e) => e.verification === 'skipped',
    contexts: ['correspondence'],
  },
  {
    id: 'allocation-unsuccessful',
    applies: (e) => e.allocationLosses > 0,
    contexts: ['correspondence'],
  },
  { id: 'appendix-reviewed', applies: (e) => e.appendixOpened, contexts: ['records'] },
];

/**
 * The one new notice this page may show, or null. Callbacks are filtered by the page's context
 * first, then taken in fixed priority; the cookie invitation only fills an otherwise empty slot.
 */
export function selectNotice(
  category: CategoryId | null,
  evidence: Evidence,
  file: CaseFile,
): NoticeId | null {
  if (!category) return null;
  const issued = new Set(file.issuedNotices);
  for (const c of CALLBACKS)
    if (c.contexts.includes(category) && c.applies(evidence) && !issued.has(c.id)) return c.id;
  if (evidence.cookiePending && file.departments.length >= 2 && !issued.has('cookie-invitation'))
    return 'cookie-invitation';
  return null;
}

export interface ReleaseSummary {
  departments: number;
  classification: Evidence['classification'];
  verification: Evidence['verification'];
  allocationLosses: number;
  appendixOpened: boolean;
  /** False when the visitor supplied no declaration, verification, allocation or appendix. */
  supported: boolean;
}

export function releaseSummary(file: CaseFile, e: Evidence): ReleaseSummary {
  return {
    departments: file.departments.length,
    classification: e.classification,
    verification: e.verification,
    allocationLosses: e.allocationLosses,
    appendixOpened: e.appendixOpened,
    supported:
      e.classification !== null ||
      e.verification !== null ||
      e.allocationLosses > 0 ||
      e.appendixOpened,
  };
}
