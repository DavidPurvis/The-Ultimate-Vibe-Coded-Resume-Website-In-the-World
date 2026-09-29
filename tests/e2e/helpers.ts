import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../../src/content/site/meta';
import { expectedPages } from '../../scripts/scan-dist/policies';

export const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');

/**
 * Pre-seed this tab's session record and/or the saved preferences before the first page loads
 * (the production code path: stored values). Written once per test, so reloads see real changes.
 */
export async function seedStorage(
  page: Page,
  { session, prefs }: { session?: Record<string, unknown>; prefs?: Record<string, unknown> },
): Promise<void> {
  const flag = `__seed:${JSON.stringify({ session, prefs })}`;
  await page.addInitScript(
    ([s, p, f]) => {
      try {
        if (sessionStorage.getItem(f as string)) return;
        if (s) sessionStorage.setItem('uvcr:session', JSON.stringify({ v: 1, ...(s as object) }));
        if (p) localStorage.setItem('uvcr:prefs', JSON.stringify({ v: 1, ...(p as object) }));
        sessionStorage.setItem(f as string, '1');
      } catch {
        /* ignore */
      }
    },
    [session ?? null, prefs ?? null, flag] as const,
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

/**
 * Every HTML page, relative to the base path: the route table, the share decoys and the newsletter
 * posts (the same list the scanner checks the build against), 404 and the OG card excluded.
 */
export const HTML_ROUTES: readonly string[] = [...expectedPages()].filter(
  (r) => r !== '404.html' && r !== 'og-card/',
);

/** The route table only (one page per service): for sweeps that don't need every post. */
export const SERVICE_ROUTES: readonly string[] = Object.values(ROUTES)
  .map((r) => r.path)
  .filter((p) => p !== '/404.html')
  .map((p) => p.slice(1));

/**
 * Pre-seed preferences (merged over the saved ones and the defaults, cookie notice answered) and,
 * optionally, this tab's session, once per test. The attraction specs use this so the cookie
 * invitation and other state don't interrupt what they are testing.
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
              sound: false,
              hud: 'off',
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
