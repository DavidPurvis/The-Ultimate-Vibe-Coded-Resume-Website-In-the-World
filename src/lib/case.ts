import { caseCopy } from '../content/copy/case';
import type { SessionState } from './storage';

export const DEPARTMENT_ROUTES = {
  '/': 'intake',
  '/verify/': 'verification',
  '/about/': 'character',
  '/skills/': 'skills',
  '/beliefs/': 'research',
  '/support/': 'causes',
  '/casino/': 'allocation',
  '/contact/': 'correspondence',
  '/projects/': 'projects',
  '/personnel-file/': 'personnel',
  '/wishlist/': 'procurement',
  '/cube/': 'cube',
  '/doom/': 'doom',
  '/nintendo/': 'nintendo',
  '/sell-your-data/': 'data',
  '/confess/': 'confession',
  '/presentation/': 'presentation',
  '/tailor/': 'tailoring',
  '/blog/': 'newsletter',
  '/rick/': 'music',
} as const;

export type DepartmentId = (typeof DEPARTMENT_ROUTES)[keyof typeof DEPARTMENT_ROUTES];
export type CaseNoticeId = keyof typeof caseCopy.notices;
export type CaseTier = 'intake' | 'review' | 'oversight';

export interface CaseFile {
  departments: DepartmentId[];
  issuedNotices: CaseNoticeId[];
  released: boolean;
}

export const DEFAULT_CASE_FILE: CaseFile = {
  departments: [],
  issuedNotices: [],
  released: false,
};

const departmentIds = new Set<string>(Object.values(DEPARTMENT_ROUTES));
const noticeIds = new Set<string>(Object.keys(caseCopy.notices));

export function validateCaseFile(value: unknown): CaseFile {
  const raw = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  const unique = <T extends string>(items: unknown, allowed: Set<string>): T[] =>
    Array.isArray(items)
      ? [...new Set(items.filter((id): id is T => typeof id === 'string' && allowed.has(id)))]
      : [];
  return {
    departments: unique<DepartmentId>(raw.departments, departmentIds),
    issuedNotices: unique<CaseNoticeId>(raw.issuedNotices, noticeIds),
    released: raw.released === true,
  };
}

export function departmentForRoute(route: string): DepartmentId | null {
  const path = route.split(/[?#]/, 1)[0] ?? '';
  const normalized = path.endsWith('/') ? path : `${path}/`;
  if (/^\/blog\/[^/]+\/$/.test(normalized) && !/\.[^/]+\/$/.test(normalized)) return 'newsletter';
  return DEPARTMENT_ROUTES[normalized as keyof typeof DEPARTMENT_ROUTES] ?? null;
}

export type CaseEvent =
  | { type: 'DEPARTMENT_ENTERED'; department: DepartmentId }
  | { type: 'NOTICE_RENDERED'; notice: CaseNoticeId }
  | { type: 'RELEASE_COMPLETED' };

export function caseReducer(state: CaseFile, event: CaseEvent): CaseFile {
  if (event.type === 'DEPARTMENT_ENTERED') {
    if (state.departments.includes(event.department)) return state;
    return { ...state, departments: [...state.departments, event.department] };
  }
  if (event.type === 'NOTICE_RENDERED') {
    if (state.issuedNotices.includes(event.notice)) return state;
    return { ...state, issuedNotices: [...state.issuedNotices, event.notice] };
  }
  return state.released ? state : { ...state, released: true };
}

export function caseTier(state: CaseFile): CaseTier {
  return state.departments.length >= 4 ? 'oversight' : state.departments.length >= 2 ? 'review' : 'intake';
}

export type CaseEvidence = Pick<SessionState, 'identity' | 'captcha' | 'casinoLosses' | 'appendixOpened'>;

function evidenceNotices(evidence: CaseEvidence): CaseNoticeId[] {
  const ids: CaseNoticeId[] = [];
  if (evidence.identity?.refused) ids.push('classification-withheld');
  if (evidence.captcha?.method === 'skipped') ids.push('inspection-waived');
  if (evidence.casinoLosses > 0) ids.push('allocation-loss');
  if (evidence.appendixOpened) ids.push('appendix-reviewed');
  if ((evidence.captcha?.totalRejections ?? 0) > 0) ids.push('verification-revised');
  return ids;
}

export interface CasePresentation {
  tier: CaseTier;
  status: string;
  notice: { id: CaseNoticeId; text: string } | null;
  cookieNotice: boolean;
  departmentAd: boolean;
}

export function casePresentation(
  route: string,
  state: CaseFile,
  evidence: CaseEvidence,
  options: { chaos: boolean; cookiePending: boolean; sincere?: boolean },
): CasePresentation {
  const tier = caseTier(state);
  const permitted = options.chaos && !options.sincere && departmentForRoute(route) !== null && !state.released;
  const candidates = tier === 'intake' ? [] : evidenceNotices(evidence);
  if (tier !== 'intake') candidates.push(tier === 'oversight' ? 'oversight-opened' : 'file-circulated');
  const id = permitted ? candidates.find((candidate) => !state.issuedNotices.includes(candidate)) : undefined;
  return {
    tier,
    status: !options.chaos ? caseCopy.status.direct : state.released ? caseCopy.status.released : caseCopy.status[tier],
    notice: id ? { id, text: caseCopy.notices[id] } : null,
    cookieNotice: permitted && state.departments.length >= 2 && options.cookiePending,
    departmentAd: permitted && tier === 'oversight',
  };
}

export function releaseRuling(evidence: CaseEvidence): string {
  if (evidence.identity?.refused) return caseCopy.ruling.refused;
  if (evidence.captcha?.method === 'skipped') return caseCopy.ruling.skipped;
  if (evidence.casinoLosses > 0) return caseCopy.ruling.loss;
  if (evidence.appendixOpened) return caseCopy.ruling.appendix;
  return caseCopy.ruling.neutral;
}
