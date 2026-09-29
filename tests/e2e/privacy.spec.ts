import { expect, test, type Page } from '@playwright/test';
import { HTML_ROUTES } from './helpers';

/** Record off-origin requests and CSP violations for the whole test. */
async function watch(page: Page): Promise<{ offOrigin: string[]; violations: string[] }> {
  const offOrigin: string[] = [];
  const violations: string[] = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.hostname !== '127.0.0.1' && u.protocol !== 'data:') offOrigin.push(r.url());
  });
  page.on('console', (m) => {
    if (m.text().startsWith('CSP violation')) violations.push(m.text());
  });
  await page.addInitScript(() => {
    document.addEventListener('securitypolicyviolation', (e) =>
      console.error(`CSP violation: ${e.violatedDirective} ${e.blockedURI}`),
    );
  });
  return { offOrigin, violations };
}

test('a whole visit: no cookies, no third parties, no CSP violations @smoke', async ({
  page,
  context,
}) => {
  const { offOrigin, violations } = await watch(page);
  for (const r of HTML_ROUTES) {
    await page.goto(r);
    await page.waitForLoadState('load');
  }

  expect(offOrigin, offOrigin.join('\n')).toEqual([]);
  expect(violations, violations.join('\n')).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  // Only the site's own two records may exist, and only if something was recorded.
  const keys = await page.evaluate(() =>
    [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter(
      (k) => !k.startsWith('__seed:'),
    ),
  );
  for (const k of keys) expect(['uvcr:prefs', 'uvcr:session'], k).toContain(k);
});
