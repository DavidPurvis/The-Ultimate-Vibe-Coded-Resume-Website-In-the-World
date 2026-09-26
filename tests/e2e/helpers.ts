import { expect, type Page } from '@playwright/test';

export const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');

/**
 * Pre-seed prefs so the cookie banner / identity dialog don't interrupt unrelated tests.
 * Each call has its own "already applied" flag, so stacked seeds apply in order exactly once and
 * later navigations keep whatever state the page itself wrote.
 */
export async function seedPrefs(
  page: Page,
  prefs: Record<string, unknown> = {},
  session: Record<string, unknown> | null = null,
): Promise<void> {
  const flag = `__seeded:${JSON.stringify([prefs, session])}`;
  await page.addInitScript(
    ([p, s, f]) => {
      try {
        if (!sessionStorage.getItem(f)) {
          const prev = JSON.parse(localStorage.getItem('uvcr:prefs') || '{}') as object;
          localStorage.setItem(
            'uvcr:prefs',
            JSON.stringify({
              v: 1,
              mode: 'chaos',
              theme: 'system',
              cookieBanner: 'accepted',
              notified: false,
              sound: false,
              ...prev,
              ...p,
            }),
          );
          if (s) sessionStorage.setItem('uvcr:session', JSON.stringify({ v: 1, ...s }));
          sessionStorage.setItem(f, '1');
        }
      } catch {
        /* ignore */
      }
    },
    [prefs, session, flag] as const,
  );
}

/** Collect console errors, page errors and CSP violations for assertion at the end of a test. */
export async function watchErrors(page: Page): Promise<() => Promise<void>> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()} @ ${m.location().url}`);
  });
  page.on('requestfailed', (r) => errors.push(`requestfailed: ${r.url()}`));
  page.on('response', (r) => {
    if (r.status() >= 400 && !r.url().includes('youtube'))
      errors.push(`HTTP ${r.status()}: ${r.url()}`);
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) => {
      console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`);
    });
  });
  return async () => {
    expect(errors, errors.join('\n')).toEqual([]);
  };
}

/** Every prerendered HTML route, relative to the base (no leading slash). */
export const HTML_ROUTES = [
  '',
  'verify/',
  'about/',
  'skills/',
  'beliefs/',
  'support/',
  'legal/',
  'casino/',
  'contact/',
  'projects/',
  'how-it-was-built/',
  'credits/',
  'personnel-file/',
  'wishlist/',
  'nintendo/',
  'tribute/',
  'sell-your-data/',
  'confess/',
  'presentation/',
  'blog/',
  'blog/zipper-merge/',
  'blog/national-security/',
  'blog/thermite-mute/',
  'blog/goldfish/',
  'blog/ordained/',
  'rick/',
  'r/oracle-integration/',
  'r/xml-parser/',
  'r/car-thing/',
  'resume/',
] as const;
