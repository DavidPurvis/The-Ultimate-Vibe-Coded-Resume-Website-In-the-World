// @vitest-environment happy-dom
/**
 * The case record on the page: a page entry records its department once, the status line states
 * the tier, and at most one notice appears, counted as issued only when it is actually visible.
 * Direct access records nothing and shows nothing; nothing appears over an active procedure.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { initCaseRecord, type CaseCopy } from '../../src/case/notices';
import { _resetMode, initMode, setMode } from '../../src/lib/mode';
import { _reset, register, start } from '../../src/lib/scene';
import { readSession, writePrefs, writeSession } from '../../src/lib/storage';
import { emptyCaseFile, type DepartmentId } from '../../src/case/state';
import { cookieInvitation, noticeLabel, notices, status } from '../../src/content/department/case';

const COPY: CaseCopy = { status, notices, noticeLabel, cookie: cookieInvitation };

function page(route: string, category: string | null): void {
  document.head.innerHTML = `<meta name="department-route" content="${route}">${
    category ? `<meta name="department-category" content="${category}">` : ''
  }`;
  document.body.innerHTML = `<main id="main" tabindex="-1"></main>
    <div class="case-bar" data-case-bar data-case-copy='${JSON.stringify(COPY).replace(/'/g, '&#39;')}'>
      <p data-status hidden><span data-status-text></span></p>
      <div data-notice-slot></div>
    </div>`;
}
const statusText = () =>
  document.querySelector<HTMLElement>('[data-status]')?.hidden
    ? null
    : (document.querySelector('[data-status-text]')?.textContent ?? null);
const notice = () => document.querySelector<HTMLElement>('[data-notice]')?.dataset.notice ?? null;
const file = () => readSession().caseFile;
const visited = (...departments: DepartmentId[]) =>
  writeSession({ caseFile: { ...emptyCaseFile(), departments } });

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  _reset();
  _resetMode();
  document.documentElement.removeAttribute('data-mode');
  initMode();
  writePrefs({ cookieBanner: 'accepted' });
});

describe('department counting', () => {
  it('a page entry records its department once; reloads add nothing', () => {
    page('/about/', 'records');
    initCaseRecord();
    initCaseRecord();
    expect(file().departments).toEqual(['character-review']);
    expect(statusText()).toBe('Request received.');
  });

  it('every newsletter page is one department; excluded routes record nothing', () => {
    for (const r of ['/blog/', '/blog/goldfish/', '/blog/zipper-merge/']) {
      page(r, 'records');
      initCaseRecord();
    }
    for (const r of ['/privacy/', '/credits/', '/resume/', '/r/xml-parser/', '/404.html']) {
      page(r, null);
      initCaseRecord();
    }
    expect(file().departments).toEqual(['newsletter']);
  });

  it('the status tier follows the count: 0–1, 2–3, 4+', () => {
    const tiers: (string | null)[] = [];
    for (const r of ['/', '/verify/', '/skills/', '/cube/']) {
      page(r, 'records');
      initCaseRecord();
      tiers.push(statusText());
    }
    expect(tiers).toEqual([
      'Request received.',
      'Your file has been circulated.',
      'Your file has been circulated.',
      'Additional interest has been referred for review.',
    ]);
  });

  it('Direct access records no history and shows no status or notice', () => {
    setMode('recruiter', { announce: false });
    writeSession({ identity: { declared: 'withheld', model: null, transcription: null } });
    page('/about/', 'records');
    initCaseRecord();
    expect(file().departments).toEqual([]);
    expect(statusText()).toBeNull();
    expect(notice()).toBeNull();
  });
});

describe('notices', () => {
  it('shows one evidence-backed callback in its context, once', () => {
    writeSession({ identity: { declared: 'withheld', model: null, transcription: null } });
    page('/projects/', 'records');
    initCaseRecord();
    expect(notice()).toBe('classification-withheld');
    expect(document.querySelector('[data-notice-slot]')?.textContent).toContain(
      'Classification withheld. Classification requirement satisfied.',
    );
    expect(file().issuedNotices).toEqual(['classification-withheld']);
    page('/skills/', 'records');
    initCaseRecord();
    expect(notice()).toBeNull();
  });

  it('a callback waits for a page in its own context', () => {
    writeSession({
      captcha: {
        round: 'windows',
        roundRejections: 0,
        totalRejections: 0,
        completed: false,
        method: 'skipped',
      },
    });
    page('/skills/', 'records');
    initCaseRecord();
    expect(notice()).toBeNull();
    page('/contact/', 'correspondence');
    initCaseRecord();
    expect(notice()).toBe('inspection-absent');
  });

  it('a notice that could not be seen is not counted as issued', () => {
    writeSession({ identity: { declared: 'withheld', model: null, transcription: null } });
    page('/projects/', 'records');
    document.querySelector('[data-case-bar]')?.setAttribute('hidden', '');
    initCaseRecord();
    expect(notice()).toBeNull();
    expect(file().issuedNotices).toEqual([]);
  });

  it('nothing appears over an active procedure', async () => {
    register({ id: 'procedure', major: true, start() {} });
    await start('procedure');
    writeSession({ identity: { declared: 'withheld', model: null, transcription: null } });
    page('/projects/', 'records');
    initCaseRecord();
    expect(notice()).toBeNull();
    expect(file().issuedNotices).toEqual([]);
  });

  it('the cookie invitation fills an empty slot from the second department on', () => {
    writePrefs({ cookieBanner: 'pending' });
    page('/', 'visitor-services');
    initCaseRecord();
    expect(notice()).toBeNull();
    page('/cube/', 'recreation');
    initCaseRecord();
    expect(notice()).toBe('cookie-invitation');
    const slot = document.querySelector<HTMLElement>('[data-notice-slot]');
    expect(slot?.querySelector('[data-cookie-admin]')?.textContent).toBe(
      'Review cookie preferences',
    );
    // "Not now" removes it and leaves focus somewhere sensible; it is not offered again.
    const later = [...(slot?.querySelectorAll('button') ?? [])].find(
      (b) => b.textContent === 'Not now',
    );
    later?.focus();
    later?.click();
    expect(notice()).toBeNull();
    expect(document.activeElement?.id).toBe('main');
    page('/presentation/', 'recreation');
    initCaseRecord();
    expect(notice()).toBeNull();
  });

  it('answering cookie administration removes a displayed invitation', () => {
    writePrefs({ cookieBanner: 'pending' });
    visited('intake');
    page('/cube/', 'recreation');
    initCaseRecord();
    expect(notice()).toBe('cookie-invitation');
    document.dispatchEvent(new Event('uvcr:cookies'));
    expect(notice()).toBeNull();
  });

  it('turning on Direct access clears the notice and the status line', () => {
    writeSession({ identity: { declared: 'withheld', model: null, transcription: null } });
    page('/projects/', 'records');
    initCaseRecord();
    expect(notice()).toBe('classification-withheld');
    setMode('recruiter', { announce: false });
    expect(notice()).toBeNull();
    expect(statusText()).toBeNull();
    setMode('chaos', { announce: false });
    expect(statusText()).toBe('Request received.');
    expect(notice()).toBeNull();
  });

  it('a page without the case bar (the tribute) does nothing at all', () => {
    document.head.innerHTML = '<meta name="department-route" content="/tribute/">';
    document.body.innerHTML = '<main></main>';
    initCaseRecord();
    expect(file()).toEqual(emptyCaseFile());
  });
});
