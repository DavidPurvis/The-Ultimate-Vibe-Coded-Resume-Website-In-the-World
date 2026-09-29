import { expect, test } from '@playwright/test';
import { SERVICE_ROUTES, seedPrefs } from '../helpers';

test.describe('the advertising archive', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('ads live only in the archive on the directory, closed until opened @smoke', async ({
    page,
    request,
  }) => {
    await page.goto('./');
    const archive = page.locator('#recreation details.archive');
    const ad = archive.getByRole('complementary', { name: 'Parody ad' });
    await expect(ad).toBeHidden();
    await archive.getByText('Open the advertising archive').click();
    await expect(ad).toBeVisible();
    await expect(ad).toContainText(/ad/i);
    // No other page carries an advertisement.
    for (const r of SERVICE_ROUTES.filter((x) => x !== '')) {
      const html = await (await request.get(r)).text();
      expect(html, r).not.toContain('data-parody-ad');
    }
  });

  test('"Skip this ad" skips to another ad', async ({ page }) => {
    await page.goto('./');
    await page.getByText('Open the advertising archive').click();
    const ad = page.locator('[data-parody-ad]');
    const before = await ad.getAttribute('data-variant');
    await ad.getByRole('button', { name: 'Skip this ad (to another ad)' }).click();
    await expect(ad).not.toHaveAttribute('data-variant', before ?? '');
    await expect(ad.locator('.pb__text')).toContainText(/\S/);
  });

  test('Direct access takes the archive’s ad down', async ({ page }) => {
    await page.goto('./');
    await page.getByText('Open the advertising archive').click();
    await page.locator('header').getByRole('switch', { name: 'Direct access' }).click();
    await expect(page.locator('[data-parody-ad]')).toBeHidden();
  });
});
