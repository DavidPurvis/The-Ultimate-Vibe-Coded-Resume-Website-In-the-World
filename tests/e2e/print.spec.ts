import { expect, test } from '@playwright/test';
import { HTML_ROUTES } from './helpers';

test('printing the home page prints the résumé and nothing else', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await page.goto('./');
  const resume = page.locator('.print-only .resume');
  await expect(resume).toBeVisible();
  await expect(resume).toContainText('Magna Cum Laude');
  await expect(page.locator('main')).toBeHidden();
  await expect(page.locator('.site-bar')).toBeHidden();
  await expect(page.locator('footer')).toBeHidden();
});

test('every other page prints itself, without the site chrome', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  for (const r of HTML_ROUTES.filter((x) => x !== '')) {
    await page.goto(r);
    await expect(page.locator('main'), r).toBeVisible();
    await expect(page.locator('.print-only'), r).toHaveCount(0);
    for (const el of await page.locator('.site-bar, .site-foot, .skip-link').all())
      await expect(el, r).toBeHidden();
  }
});
