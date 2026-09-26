import { expect, test } from '@playwright/test';
import { HTML_ROUTES, seedPrefs } from './helpers';

test('Ctrl+P from any page prints the résumé and nothing else', async ({ page }) => {
  await seedPrefs(page, {}, { identityPrompted: true });
  await page.emulateMedia({ media: 'print' });
  for (const r of HTML_ROUTES.filter((x) => x !== 'resume/')) {
    await page.goto(r);
    const resume = page.locator('.print-only .resume');
    await expect(resume, r).toBeVisible();
    await expect(resume, r).toContainText('Magna Cum Laude');
    await expect(page.locator('main'), r).toBeHidden();
    await expect(page.locator('header.site-header'), r).toBeHidden();
    await expect(page.locator('footer'), r).toBeHidden();
  }
});
