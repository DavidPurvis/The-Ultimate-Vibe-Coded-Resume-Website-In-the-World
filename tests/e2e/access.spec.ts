/** The résumé is always one activation away, from every page and without JavaScript. */
import { expect, test } from '@playwright/test';

test.describe('access', () => {
  test('the skip link is the first Tab stop and goes straight to the résumé @smoke', async ({
    page,
  }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to the résumé' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/resume\/$/);
  });

  test('the front desk offers a résumé request and a direct link beside it @smoke', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Department of David Purvis');
    const request = page.getByRole('link', { name: 'Request résumé' });
    const direct = page.getByRole('link', { name: 'Go directly to résumé' });
    await expect(request).toHaveAttribute('href', /\/resume\/$/);
    await expect(direct).toHaveAttribute('href', /\/resume\/$/);
    await direct.click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });

  test('opening the front desk opens no dialog and moves no focus', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the front desk and the résumé work immediately @smoke', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Request résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await expect(page.locator('main .resume')).toContainText('Magna Cum Laude');
  });
});
