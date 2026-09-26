/** /privacy/ tells the truth about storage: it lists what is there and clears it on request. */
import { expect, test } from '@playwright/test';
import { seedCase } from './helpers';

test('lists exactly what this tab stores, and Reset clears it @smoke', async ({ page }) => {
  await seedCase(page, { events: [{ t: 'RESUME_REQUESTED', via: 'cta' }] });
  await page.goto('privacy/');
  const rows = page.locator('[data-storage-rows] tr');
  await expect(rows).toHaveCount(1);
  await expect(rows.first()).toContainText('uvcr:case');
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

test('removes the previous site’s keys, and only those', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('__legacy')) return;
    sessionStorage.setItem('__legacy', '1');
    localStorage.setItem('uvcr:prefs', '{"v":1,"theme":"comic"}');
    localStorage.setItem('uvcr:biscotti:01', 'x');
    sessionStorage.setItem('uvcr:session', '{"v":1}');
    localStorage.setItem('someone-else', 'keep');
  });
  for (const r of ['privacy/', './']) {
    await page.goto(r);
    await expect(page.locator('main')).toBeVisible();
    const keys = await page.evaluate(() => ({
      local: Object.keys(localStorage).sort(),
      session: Object.keys(sessionStorage).filter((k) => k.startsWith('uvcr:')),
    }));
    expect(keys, r).toEqual({ local: ['someone-else'], session: [] });
    await page.evaluate(() => sessionStorage.removeItem('__legacy'));
  }
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', /./);
});

test('without JavaScript, it says nothing is stored', async ({ request }) => {
  const html = await (await request.get('privacy/')).text();
  expect(html).toMatch(
    /<noscript>[^]*With JavaScript off, this site stores nothing at all\.[^]*<\/noscript>/,
  );
});
