import { expect, test } from '@playwright/test';
import { seedPrefs } from './helpers';

test.describe('parody ads that just say "ad"', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
  });

  test('gag pages carry two, the résumé carries none @smoke', async ({ page }) => {
    await page.goto('about/');
    const ads = page.getByRole('complementary', { name: 'Parody ad' });
    await expect(ads).toHaveCount(2);
    await expect(ads.first()).toContainText(/ad/i);
    await page.goto('resume/');
    await expect(page.locator('[data-parody-ad]')).toHaveCount(0);
  });

  test('"Skip this ad" skips to another ad', async ({ page }) => {
    await page.goto('skills/');
    const ad = page.locator('[data-parody-ad]').first();
    const before = await ad.getAttribute('data-variant');
    await ad.getByRole('button', { name: 'Skip this ad (to another ad)' }).click();
    await expect(ad).not.toHaveAttribute('data-variant', before ?? '');
    await expect(ad.locator('.pb__text')).toContainText(/\S/);
  });

  test('the same page always shows the same ads (no layout surprises)', async ({ page }) => {
    await page.goto('beliefs/');
    const first = await page
      .locator('[data-parody-ad]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-variant')));
    await page.reload();
    const second = await page
      .locator('[data-parody-ad]')
      .evaluateAll((els) => els.map((e) => e.getAttribute('data-variant')));
    expect(second).toEqual(first);
  });

  test('Recruiter Mode takes the ads down', async ({ page }) => {
    await page.goto('support/');
    await page.getByRole('switch', { name: 'Recruiter Mode' }).click();
    await expect(page.locator('[data-parody-ad]').first()).toBeHidden();
  });

  test('grouped departments menu lists every division', async ({ page }) => {
    await page.goto('about/');
    await page.locator('[data-dept-menu] summary').click();
    const nav = page.getByRole('navigation', { name: 'Departments' });
    for (const g of ['The Gauntlet', 'Forms', 'Legal'])
      await expect(nav.getByRole('list', { name: g })).toBeVisible();
  });
});
