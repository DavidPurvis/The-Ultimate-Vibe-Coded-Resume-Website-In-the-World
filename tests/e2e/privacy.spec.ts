import { expect, test, type Page } from '@playwright/test';
import { HTML_ROUTES, seedCase } from './helpers';

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

const events = (page: Page) =>
  page.evaluate(
    () =>
      (
        JSON.parse(sessionStorage.getItem('uvcr:case') ?? '{"events":[]}') as {
          events: { t: string }[];
        }
      ).events,
  );

test('a whole visit: no cookies, no third parties, no CSP violations, one key @smoke', async ({
  page,
  context,
}) => {
  const { offOrigin, violations } = await watch(page);
  for (const r of HTML_ROUTES) {
    await page.goto(r);
    await page.waitForLoadState('load');
  }
  // Open a case and close it the fast way.
  await page.goto('./');
  await page.getByRole('link', { name: 'View résumé' }).click();
  await page.getByRole('button', { name: 'Request expedited processing' }).click();
  await expect(page.locator('#case-heading')).toHaveText('Case closed');

  expect(offOrigin, offOrigin.join('\n')).toEqual([]);
  expect(violations, violations.join('\n')).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  const keys = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage).filter((k) => !k.startsWith('__case:')),
  }));
  expect(keys).toEqual({ local: [], session: ['uvcr:case'] });
  for (const e of await events(page))
    expect(
      Object.keys(e).every((k) => ['t', 'via', 'lane', 'step', 'duration', 'target'].includes(k)),
    ).toBe(true);
});

test.describe('with Global Privacy Control', () => {
  test.beforeEach(async ({ context }) => {
    // Every tab in this context sends Global Privacy Control.
    await context.addInitScript(() =>
      Object.defineProperty(Navigator.prototype, 'globalPrivacyControl', { get: () => true }),
    );
  });

  test('the Department notices nothing ambient, and says so in its findings', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'View résumé' }).click();
    await expect(page.locator('#case-heading')).toHaveText('Scope clarification');
    await page.evaluate(() => {
      const set = (v: string) => {
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => v });
        document.dispatchEvent(new Event('visibilitychange'));
      };
      set('hidden');
      set('visible');
      document.dispatchEvent(new Event('copy'));
    });
    expect((await events(page)).map((e) => e.t)).toEqual(['RESUME_REQUESTED']);

    const p = await page.context().newPage();
    await seedCase(p, {
      events: [
        { t: 'RESUME_REQUESTED', via: 'cta' },
        { t: 'SCOPE_STATED', lane: 'gen' },
      ],
    });
    await p.goto('./');
    await p.getByRole('button', { name: 'Request full document' }).click();
    for (let i = 0; i < 3; i++) {
      await p.locator('[data-release]').focus();
      await p.keyboard.press('Enter');
    }
    await p.getByRole('button', { name: 'Skip ceremony' }).click();
    await expect(p.locator('#case')).toContainText('Global Privacy Control honored.');
  });
});
