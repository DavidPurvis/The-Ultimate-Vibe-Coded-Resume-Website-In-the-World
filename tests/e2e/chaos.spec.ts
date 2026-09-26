import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

test.describe('global chaos layer', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('skip link is the first Tab stop and reaches the résumé in Recruiter Mode @smoke', async ({
    page,
  }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip the gauntlet → résumé' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/resume\/\?mode=recruiter$/);
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
  });

  test('Konami toggles Recruiter Mode, but not while typing', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('./');
    const seq = [
      'ArrowUp',
      'ArrowUp',
      'ArrowDown',
      'ArrowDown',
      'ArrowLeft',
      'ArrowRight',
      'ArrowLeft',
      'ArrowRight',
      'b',
      'a',
    ];
    for (const k of seq) await page.keyboard.press(k);
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
    await expect(page.locator('[data-threat]')).toBeHidden();
    await expect(page.getByRole('switch', { name: 'Recruiter Mode' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    for (const k of seq) await page.keyboard.press(k);
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'chaos');
    await done();
  });

  test('Recruiter Mode switch persists across pages', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('switch', { name: 'Recruiter Mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
    await page.goto('./');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
  });

  test('theme cycles, persists, and Lights Out masks everything but the flashlight', async ({
    page,
  }) => {
    await page.goto('./');
    const btn = page.locator('[data-theme-cycle]');
    await expect(btn).toContainText('Theme: Dark →');
    await btn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await btn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'darker');
    await btn.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'lights-out');
    await expect(page.locator('[data-lights-out]')).toHaveCount(1);
    await page.mouse.move(300, 400);
    await page.waitForTimeout(100);
    const shot = await page.screenshot();
    const { PNG } = await import('./png');
    const img = PNG.decode(shot);
    const lum = (x: number, y: number) => {
      const i = (y * img.width + x) * 4;
      return (
        (0.2126 * (img.data[i] ?? 0) +
          0.7152 * (img.data[i + 1] ?? 0) +
          0.0722 * (img.data[i + 2] ?? 0)) /
        255
      );
    };
    expect(lum(img.width - 5, img.height - 5)).toBeLessThan(0.1);
    await page.keyboard.press('Escape');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(page.locator('[data-lights-out]')).toHaveCount(0);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await page.getByRole('button', { name: 'Reset theme' }).click();
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  });

  test('switching to Recruiter Mode during Lights Out restores the page', async ({ page }) => {
    await seedPrefs(page, { theme: 'lights-out' });
    await page.goto('./');
    await expect(page.locator('[data-lights-out]')).toHaveCount(1);
    await page.getByRole('switch', { name: 'Recruiter Mode' }).click();
    await expect(page.locator('[data-lights-out]')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.+/);
  });

  test('tab guilt swaps title and favicon while hidden, then restores', async ({ page }) => {
    await page.goto('./');
    const original = await page.title();
    const setHidden = (hidden: boolean) =>
      page.evaluate((h) => {
        Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
        document.dispatchEvent(new Event('visibilitychange'));
      }, hidden);
    await setHidden(true);
    await expect(page).toHaveTitle('come back 🥺');
    await expect(page.locator('link[data-favicon]')).toHaveAttribute(
      'href',
      /favicon-crying\.svg$/,
    );
    await setHidden(false);
    await expect(page).toHaveTitle('oh thank god');
    await expect(page).toHaveTitle(original, { timeout: 4000 });
    await expect(page.locator('link[data-favicon]')).toHaveAttribute('href', /favicon\.svg$/);
  });

  test('escape hatch dodges the mouse exactly twice, then surrenders', async ({ page }) => {
    await page.goto('./');
    const hatch = page.locator('[data-hatch]');
    await hatch.scrollIntoViewIfNeeded();
    for (let i = 0; i < 2; i++) {
      const box = await hatch.boundingBox();
      await page.mouse.move(0, 0);
      await page.mouse.move((box?.x ?? 0) + 10, (box?.y ?? 0) + 10);
      await page.waitForTimeout(250);
    }
    await expect(hatch).toHaveText('fine. → résumé');
    const before = await hatch.boundingBox();
    await hatch.hover();
    await page.waitForTimeout(250);
    expect(await hatch.boundingBox()).toEqual(before);
    await hatch.click();
    await expect(page).toHaveURL(/\/resume\/\?mode=recruiter$/);
  });

  test('escape hatch works first try by keyboard', async ({ page }) => {
    await page.goto('./');
    await page.locator('[data-hatch]').focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/resume\/\?mode=recruiter$/);
  });

  test('console greeting appears once', async ({ page }) => {
    const logs: string[] = [];
    page.on('console', (m) => {
      if (m.text().includes('DEPARTMENT OF RECRUITER VERIFICATION')) logs.push(m.text());
    });
    await page.goto('./');
    await page.waitForTimeout(200);
    expect(logs).toHaveLength(1);
  });

  test('departments menu opens, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('./');
    const summary = page.locator('[data-dept-menu] summary');
    await summary.click();
    await expect(page.getByRole('navigation', { name: 'Departments' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('navigation', { name: 'Departments' })).toBeHidden();
    await expect(summary).toBeFocused();
  });
});

test.describe('mobile @mobile', () => {
  test('escape hatch is an ordinary link on touch', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'touch only');
    await seedPrefs(page);
    await page.goto('./');
    await page.locator('[data-hatch]').tap();
    await expect(page).toHaveURL(/\/resume\/\?mode=recruiter$/);
  });
});
