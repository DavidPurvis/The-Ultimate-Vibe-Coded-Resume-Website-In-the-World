import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

/** Fill every question on a parody form the way a visitor would. */
async function fillEverything(page: Page): Promise<void> {
  const form = page.locator('[data-parody-form]');
  for (const g of await form.locator('fieldset').all()) await g.getByRole('radio').last().check();
  for (const t of await form.locator('input[type="text"]').all())
    await t.fill('how to center a div');
  for (const n of await form.locator('input[type="number"]').all()) await n.fill('47');
  for (const s of await form.locator('select').all()) await s.selectOption({ index: 2 });
  for (const r of await form.locator('input[type="range"]').all()) await r.fill('1');
}

for (const [path, submit, receipt] of [
  ['sell-your-data/', 'Sell my data for $0.00', 'TRANSACTION COMPLETE'],
  ['confess/', 'Submit confession to no one', 'CONFESSION RECEIVED (BY NO ONE)'],
] as const) {
  test.describe(path, () => {
    test.beforeEach(async ({ page }) => {
      await seedPrefs(page, {}, { identityPrompted: true });
      await page.emulateMedia({ reducedMotion: 'reduce' });
    });

    test(`${path}: completing it sends nothing, stores nothing, then clears @smoke`, async ({
      page,
    }) => {
      const done = await watchErrors(page);
      await page.goto(path);
      const storageBefore = await page.evaluate(() =>
        JSON.stringify([Object.keys(localStorage).sort(), Object.keys(sessionStorage).sort()]),
      );
      const requests: string[] = [];
      page.on('request', (r) => requests.push(`${r.method()} ${r.url()}`));

      await fillEverything(page);
      await page.getByRole('button', { name: submit }).click();
      const rec = page.locator('[data-pf-receipt]');
      await expect(rec).toBeVisible();
      await expect(rec).toContainText(receipt);
      await expect(rec).toBeFocused();

      // No network activity of any kind after the page loaded, and no new storage.
      expect(requests.filter((r) => !/\.(woff2?|svg|png)$/.test(r))).toEqual([]);
      expect(requests.filter((r) => r.startsWith('POST'))).toEqual([]);
      const storageAfter = await page.evaluate(() =>
        JSON.stringify([Object.keys(localStorage).sort(), Object.keys(sessionStorage).sort()]),
      );
      expect(storageAfter).toEqual(storageBefore);
      expect(page.url()).not.toContain('?');

      // Everything the visitor typed is gone.
      await page.getByRole('button', { name: /again/ }).click();
      const form = page.locator('[data-parody-form]');
      for (const t of await form.locator('input[type="text"], input[type="number"]').all())
        await expect(t).toHaveValue('');
      expect(await form.locator('input[type="radio"]:checked').count()).toBe(0);
      await done();
    });

    test(`${path}: nothing a real form would ask for`, async ({ page }) => {
      await page.goto(path);
      expect(await page.locator('form').count()).toBe(0);
      expect(
        await page
          .locator('input[type="password"], input[type="email"], input[type="tel"]')
          .count(),
      ).toBe(0);
      const autocompletes = await page
        .locator('[data-parody-form] input, [data-parody-form] select')
        .evaluateAll((els) => els.map((e) => e.getAttribute('autocomplete')));
      expect(autocompletes.every((a) => a === 'off')).toBe(true);
    });

    test(`${path}: without JavaScript there is no way to submit`, async ({ browser }) => {
      const ctx = await browser.newContext({ javaScriptEnabled: false });
      const p = await ctx.newPage();
      await p.goto(path);
      await expect(p.getByRole('button', { name: submit })).toBeHidden();
      await p.locator('[data-parody-form] input[type="text"]').first().fill('secret');
      await p.keyboard.press('Enter');
      expect(p.url()).not.toContain('secret');
      await ctx.close();
    });
  });
}

test('question numbers skip 7, like everything else', async ({ page }) => {
  await page.goto('sell-your-data/');
  const nums = await page.locator('.pf__n').allInnerTexts();
  expect(nums.some((n) => n.includes('7'))).toBe(false);
  expect(nums).toContain('Q8.');
});
