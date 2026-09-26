import { expect, type Page } from '@playwright/test';
import { ROUTES } from '../../src/content/site/meta';

export const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');

/**
 * Pre-seed the Access Request case in sessionStorage (the production code path: a stored case).
 * The seed makes every cosmetic choice reproducible; `events` restores a case mid-flow.
 */
export async function seedCase(
  page: Page,
  { seed = 4242, events = [] as unknown[] }: { seed?: number; events?: unknown[] } = {},
): Promise<void> {
  const flag = `__case:${seed}:${JSON.stringify(events)}`;
  await page.addInitScript(
    ([s, ev, f]) => {
      try {
        if (sessionStorage.getItem(f as string)) return;
        const opened = (ev as { t: string }[]).some((e) => e.t === 'RESUME_REQUESTED');
        sessionStorage.setItem(
          'uvcr:case',
          JSON.stringify({ v: 2, seed: s, events: ev, hint: opened ? 'open' : 'arrival' }),
        );
        sessionStorage.setItem(f as string, '1');
      } catch {
        /* ignore */
      }
    },
    [seed, events, flag] as const,
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
