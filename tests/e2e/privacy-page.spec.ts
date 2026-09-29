/** /privacy/ tells the truth about storage: it lists what is there and clears it on request. */
import { expect, test } from '@playwright/test';
import { seedStorage } from './helpers';

test('lists exactly what is stored, and Reset clears it @smoke', async ({ page }) => {
  await seedStorage(page, {
    session: { caseFile: { departments: ['intake'], issuedNotices: [], released: false } },
  });
  await page.goto('privacy/');
  const rows = page.locator('[data-storage-rows] tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('uvcr:session');
  await expect(rows.first()).toContainText('Session storage (this tab)');
  await page.getByRole('button', { name: 'Clear everything this site stored' }).click();
  await expect(rows).toHaveCount(0);
  await expect(page.getByText('Nothing is stored right now.')).toBeVisible();
  await expect(page.locator('#announcer')).toHaveText('Cleared. Nothing is stored now.');
  const left = await page.evaluate(() =>
    [...Object.keys(localStorage), ...Object.keys(sessionStorage)].filter((k) =>
      k.startsWith('uvcr:'),
    ),
  );
  expect(left).toEqual([]);
});

test('removes only the retired case record; current records stay', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__legacy')) return;
    sessionStorage.setItem('__legacy', '1');
    sessionStorage.setItem('uvcr:case', '{"v":2,"seed":1,"events":[],"hint":"open"}');
    localStorage.setItem('uvcr:prefs', '{"v":1,"theme":"dark"}');
    sessionStorage.setItem('uvcr:session', '{"v":1}');
    localStorage.setItem('someone-else', 'keep');
  });
  await page.goto('privacy/');
  await expect(page.locator('main')).toBeVisible();
  const keys = await page.evaluate(() => ({
    local: Object.keys(localStorage).sort(),
    session: Object.keys(sessionStorage).filter((k) => k.startsWith('uvcr:')),
  }));
  expect(keys).toEqual({ local: ['someone-else', 'uvcr:prefs'], session: ['uvcr:session'] });
});

test('without JavaScript, it says nothing is stored', async ({ request }) => {
  const html = await (await request.get('privacy/')).text();
  expect(html).toMatch(
    /<noscript>[^]*With JavaScript off, this site stores nothing at all\.[^]*<\/noscript>/,
  );
});
