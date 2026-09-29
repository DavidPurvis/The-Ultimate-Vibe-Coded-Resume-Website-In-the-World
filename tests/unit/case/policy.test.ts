/** Case policy: counting, thresholds, the one notice a page may show, and the determination. */
import { describe, expect, it } from 'vitest';
import {
  canonicalRoute,
  CATEGORY_OF,
  departmentOf,
  releaseSummary,
  selectNotice,
  statusTier,
  type Evidence,
} from '../../../src/case/policy';
import { DEPARTMENT_IDS, emptyCaseFile, type CaseFile } from '../../../src/case/state';

const BASE = '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World';
const NONE: Evidence = {
  classification: null,
  verification: null,
  allocationLosses: 0,
  appendixOpened: false,
  cookiePending: false,
};
const file = (over: Partial<CaseFile> = {}): CaseFile => ({ ...emptyCaseFile(), ...over });

describe('canonicalRoute', () => {
  it('strips the GitHub Pages base path, index.html, queries and fragments', () => {
    expect(canonicalRoute(`${BASE}/`, BASE)).toBe('/');
    expect(canonicalRoute(BASE, BASE)).toBe('/');
    expect(canonicalRoute(`${BASE}/cube/index.html?x=1#top`, BASE)).toBe('/cube/');
    expect(canonicalRoute(`${BASE}/cube`, BASE)).toBe('/cube/');
    expect(canonicalRoute(`${BASE}/404.html`, BASE)).toBe('/404.html');
  });

  it('works at a domain root', () => {
    expect(canonicalRoute('/', '')).toBe('/');
    expect(canonicalRoute('/blog/goldfish/', '/')).toBe('/blog/goldfish/');
  });
});

describe('departmentOf', () => {
  it('the homepage is intake; attractions count; every newsletter page is one department', () => {
    expect(departmentOf('/')).toBe('intake');
    expect(departmentOf('/cube/')).toBe('cube');
    expect(departmentOf('/casino/')).toBe('allocation');
    expect(departmentOf('/blog/')).toBe('newsletter');
    expect(departmentOf('/blog/zipper-merge/')).toBe('newsletter');
  });

  it('résumé, privacy, legal, credits, colophon, tribute, redirects and utilities never count', () => {
    for (const r of [
      '/resume/',
      '/resume/for/emb/',
      '/resume.pdf',
      '/privacy/',
      '/legal/',
      '/credits/',
      '/how-it-was-built/',
      '/tribute/',
      '/r/github/',
      '/404.html',
      '/og-card/',
    ])
      expect(departmentOf(r), r).toBeNull();
  });

  it('every department belongs to a category', () => {
    for (const d of DEPARTMENT_IDS) expect(CATEGORY_OF[d], d).toBeTruthy();
  });
});

describe('statusTier', () => {
  it('changes at 2 and 4 departments', () => {
    expect([0, 1, 2, 3, 4, 20].map(statusTier)).toEqual([0, 0, 1, 1, 2, 2]);
  });
});

describe('selectNotice', () => {
  const everything: Evidence = {
    classification: 'withheld',
    verification: 'skipped',
    allocationLosses: 1,
    appendixOpened: true,
    cookiePending: true,
  };

  it('shows only callbacks relevant to the page’s context', () => {
    expect(selectNotice('recreation', everything, file({ departments: ['cube', 'doom'] }))).toBe(
      'cookie-invitation',
    );
    expect(selectNotice('public-affairs', { ...everything, cookiePending: false }, file())).toBe(
      null,
    );
  });

  it('filters by context, then applies the fixed priority', () => {
    expect(selectNotice('visitor-services', everything, file())).toBe('classification-withheld');
    expect(selectNotice('records', everything, file())).toBe('classification-withheld');
    expect(selectNotice('correspondence', everything, file())).toBe('inspection-absent');
    const afterRefusal = file({ issuedNotices: ['classification-withheld'] });
    expect(selectNotice('records', everything, afterRefusal)).toBe('appendix-reviewed');
    const afterSkip = file({ issuedNotices: ['inspection-absent'] });
    expect(selectNotice('correspondence', everything, afterSkip)).toBe('allocation-unsuccessful');
  });

  it('never repeats a notice', () => {
    const all = file({
      departments: ['intake', 'cube'],
      issuedNotices: [
        'classification-withheld',
        'inspection-absent',
        'allocation-unsuccessful',
        'appendix-reviewed',
        'cookie-invitation',
      ],
    });
    for (const c of ['visitor-services', 'records', 'correspondence', 'recreation'] as const)
      expect(selectNotice(c, everything, all), c).toBeNull();
  });

  it('the cookie invitation waits for two departments and an outstanding preference', () => {
    const pending = { ...NONE, cookiePending: true };
    expect(selectNotice('recreation', pending, file({ departments: ['cube'] }))).toBeNull();
    expect(selectNotice('recreation', pending, file({ departments: ['cube', 'doom'] }))).toBe(
      'cookie-invitation',
    );
    expect(selectNotice('recreation', NONE, file({ departments: ['cube', 'doom'] }))).toBeNull();
  });

  it('pages outside the departments show nothing', () => {
    expect(selectNotice(null, everything, file({ departments: ['cube', 'doom'] }))).toBeNull();
  });

  it('approval does not silence notices or exploration', () => {
    expect(selectNotice('records', everything, file({ released: true }))).toBe(
      'classification-withheld',
    );
  });
});

describe('releaseSummary', () => {
  it('reports no support when nothing was declared', () => {
    expect(releaseSummary(file({ departments: ['intake'] }), NONE)).toEqual({
      departments: 1,
      classification: null,
      verification: null,
      allocationLosses: 0,
      appendixOpened: false,
      supported: false,
    });
  });

  it('cites exactly what was recorded', () => {
    const s = releaseSummary(file({ departments: ['intake', 'cube'] }), {
      ...NONE,
      verification: 'complete',
    });
    expect(s.supported).toBe(true);
    expect(s.departments).toBe(2);
    expect(s.classification).toBeNull();
  });
});
