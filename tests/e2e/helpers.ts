import { expect, type Page } from '@playwright/test';

export const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');

/** Pre-seed prefs so the cookie banner / identity dialog don't interrupt unrelated tests. */
export async function seedPrefs(
  page: Page,
  prefs: Record<string, unknown> = {},
  session: Record<string, unknown> | null = null,
): Promise<void> {
  await page.addInitScript(
    ([p, s]) => {
      try {
        if (!sessionStorage.getItem('__seeded')) {
          localStorage.setItem(
            'uvcr:prefs',
            JSON.stringify({
              v: 1,
              mode: 'chaos',
              theme: 'system',
              cookieBanner: 'accepted',
              notified: false,
              sound: false,
              ...p,
            }),
          );
          if (s) sessionStorage.setItem('uvcr:session', JSON.stringify({ v: 1, ...s }));
          sessionStorage.setItem('__seeded', '1');
        }
      } catch {
        /* ignore */
      }
    },
    [prefs, session] as const,
  );
}

/** Collect console errors, page errors and CSP violations for assertion at the end of a test. */
export async function watchErrors(page: Page): Promise<() => Promise<void>> {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(`console: ${m.text()}`);
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
