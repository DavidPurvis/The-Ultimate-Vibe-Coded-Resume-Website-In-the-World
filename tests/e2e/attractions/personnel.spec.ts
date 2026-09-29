import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from '../helpers';

test.describe('personnel, wishlist, Nintendo, tribute', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('personnel file: all seven aliases, credentials, and the kidnapping protocol @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    await page.goto('personnel-file/');
    const names = await page.locator('.alias__name').allInnerTexts();
    expect(names).toEqual([
      'Big Purv',
      'BP',
      'Dragon',
      'Bruce',
      'Assquatch',
      'Billy Bob Joe',
      'Sasquatch.-',
    ]);
    // The Department abolished seven: alias numbers skip it.
    const ids = await page.locator('.alias .card__form-id').allInnerTexts();
    expect(ids.some((t) => t.includes('7'))).toBe(false);
    await expect(
      page.getByText('Ordained during a 10th-grade math class.', { exact: false }),
    ).toBeVisible();
    await expect(
      page.getByText('I meant to sign up for the swim meet.', { exact: false }),
    ).toBeVisible();
    await expect(page.locator('ol.kidnap > li')).toHaveCount(10);
    await expect(page.locator('.r6__op')).toHaveText([/^Thermite/, /^Mute/]);
    await done();
  });

  test('placeholders awaiting David never render', async ({ page }) => {
    await page.goto('personnel-file/');
    await expect(page.locator('[data-foods]')).toHaveCount(0);
    await expect(page.locator('[data-r6-stats]')).toHaveCount(0);
    await expect(page.locator('[data-goldfish-name]')).toHaveCount(0);
    await expect(page.locator('.alias__origin').first()).toHaveText('Origin: classified');
  });

  test('wishlist: add to cart adds nothing and returns the cart', async ({ page }) => {
    await page.goto('wishlist/');
    await expect(page.locator('[data-wish]')).toHaveCount(12);
    await page.locator('[data-wish="cube"]').getByRole('button', { name: 'Add to cart' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'returned to the corral' }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => Object.keys(localStorage).filter((k) => /cart/i.test(k))),
    ).toEqual([]);
  });

  test('Nintendo can confirm they will not sue', async ({ page }) => {
    await page.goto('nintendo/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Dear Nintendo (Please Don’t Sue Me)',
    );
    const btn = page.getByRole('button', {
      name: 'Nintendo Legal: click here to confirm you will not sue',
    });
    await btn.click();
    await expect(
      page.getByRole('status').filter({ hasText: 'NON-LAWSUIT CONFIRMED' }),
    ).toBeVisible();
    await expect(btn).toBeDisabled();
  });

  test('the tribute is sincere: no ads, no gags, no Department @smoke', async ({ page }) => {
    await page.goto('tribute/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Terry A. Davis');
    await expect(page.locator('[data-parody-ad]')).toHaveCount(0);
    await expect(page.locator('html')).toHaveAttribute('data-plain', '');
    await expect(page.locator('[data-status], [data-notice-slot], [data-mode-toggle]')).toHaveCount(
      0,
    );
    await expect(page.getByText('call or text 988', { exact: false })).toBeVisible();
    await expect(page.getByText('One person. One operating system.')).toBeVisible();
  });

  test('the Records and Public Affairs offices list these pages in the directory menu', async ({
    page,
  }) => {
    await page.goto('./');
    await page.locator('[data-menu] > summary').click();
    const records = page.getByRole('list', { name: 'Records' });
    await expect(records.getByRole('link', { name: 'Personnel File' })).toBeVisible();
    const affairs = page.getByRole('list', { name: 'Public Affairs' });
    for (const l of ['Wishlist', 'Public statement'])
      await expect(affairs.getByRole('link', { name: l })).toBeVisible();
  });
});
