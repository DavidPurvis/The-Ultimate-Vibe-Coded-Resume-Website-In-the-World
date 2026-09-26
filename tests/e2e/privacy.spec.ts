import { expect, test } from '@playwright/test';
import { HTML_ROUTES } from './helpers';

/**
 * The privacy page is the one thing on this site that isn't a joke. A full first-visit journey
 * (banner included) must set zero cookies, make zero off-origin requests before the rickroll
 * click, store only uvcr:* keys, and trip zero CSP violations.
 */
test('full chaos journey: no cookies, no third parties, no CSP violations @smoke', async ({
  page,
  context,
}) => {
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

  // First visit to an old gag page: the banner appears; accept it the way a visitor would.
  await page.goto('about/');
  await page.getByRole('button', { name: /Accept All Cookies/ }).click();
  for (const r of HTML_ROUTES) {
    await page.goto(r);
    await page.waitForLoadState('load');
  }
  expect(offOrigin, offOrigin.join('\n')).toEqual([]);
  expect(violations, violations.join('\n')).toEqual([]);
  expect(await context.cookies()).toEqual([]);

  const keys = await page.evaluate(() => [
    ...Object.keys(localStorage),
    ...Object.keys(sessionStorage),
  ]);
  expect(keys.length).toBeGreaterThan(0);
  expect(keys.filter((k) => !k.startsWith('uvcr:'))).toEqual([]);

  // Only after an explicit click does YouTube's privacy-enhanced player load.
  await page.route('https://www.youtube-nocookie.com/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
  );
  await page.goto('rick/');
  await page.getByRole('button', { name: 'Begin due diligence' }).click();
  await expect(page.locator('#rickroll iframe')).toHaveCount(1);
  expect(offOrigin.every((u) => u.startsWith('https://www.youtube-nocookie.com/embed/'))).toBe(
    true,
  );
  expect(offOrigin.length).toBeGreaterThan(0);
  expect(await context.cookies()).toEqual([]);
});
