import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../../src/content/site/meta';

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

/** Every prerendered HTML route, relative to the base (no leading slash). */
/** Every HTML page, relative to the base path (derived from the route table, 404 excluded). */
export const HTML_ROUTES: readonly string[] = Object.values(ROUTES)
  .map((r) => r.path)
  .filter((p) => p !== '/404.html')
  .map((p) => p.slice(1));
