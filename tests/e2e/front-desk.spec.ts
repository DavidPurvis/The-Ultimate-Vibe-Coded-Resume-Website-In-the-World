import { expect, test } from '@playwright/test';
import { seedPrefs } from './helpers';

test.describe('the records counter', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page));

  test('the ordinary file request reaches its staged evidence @smoke', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Open personnel file' }).click();
    await expect(page).toHaveURL(/\/about\/$/);
    await page.clock.install();
    await page.getByRole('button', { name: 'Review the evidence' }).click();
    const finding = page.locator('[data-finding]');
    await expect(finding).toHaveAttribute('data-processing', 'received');
    await page.clock.fastForward(700);
    await expect(finding).toHaveAttribute('data-processing', 'referred');
    await page.clock.fastForward(700);
    await expect(finding).toHaveAttribute('data-processing', 'returned');
    await page.clock.fastForward(700);
    await expect(finding).toHaveAttribute('data-processing', 'complete');
    await expect(page.locator('#finding-evidence')).toHaveText(
      'Evidence item 1 of 1Cart returned.',
    );
    await expect(page.locator('[data-finding-routing]')).toBeHidden();
  });

  test('cancel and Escape cancel pending work; reveal now finishes immediately', async ({
    page,
  }) => {
    await page.goto('about/');
    await page.clock.install();
    const start = page.getByRole('button', { name: 'Review the evidence' });
    await start.click();
    await page.getByRole('button', { name: 'Cancel review' }).click();
    await page.clock.fastForward(3000);
    await expect(page.locator('#finding-evidence')).toBeHidden();
    await expect(start).toBeFocused();
    await start.click();
    await page.keyboard.press('Escape');
    await page.clock.fastForward(3000);
    await expect(page.locator('#finding-evidence')).toBeHidden();
    await start.click();
    await page.getByRole('button', { name: 'Reveal now' }).click();
    await expect(page.locator('#finding-evidence')).toBeVisible();
    await expect(page.locator('#finding-evidence')).toBeFocused();
  });

  test('Direct access settles running work and restores the ordinary evidence', async ({
    page,
  }) => {
    await page.goto('about/');
    await page.clock.install();
    await page.getByRole('button', { name: 'Review the evidence' }).click();
    await page.locator('header').getByRole('switch', { name: 'Direct access' }).click();
    await expect(page.locator('#finding-evidence')).toBeVisible();
    await page.clock.fastForward(3000);
    await expect(page.locator('[data-finding-routing]')).toBeHidden();
    await expect(page.locator('[data-finding]')).toHaveAttribute('data-processing', 'complete');
  });

  test('another major procedure cancels evidence without late results', async ({ page }) => {
    await page.goto('./');
    await page.evaluate(() => localStorage.removeItem('uvcr:prefs'));
    await page.goto('about/');
    await page.clock.install();
    await page.getByRole('button', { name: 'Review the evidence' }).click();
    await page.getByRole('button', { name: 'Review cookie preferences' }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await page.clock.fastForward(3000);
    await expect(page.locator('#finding-evidence')).toBeHidden();
    await expect(page.locator('[data-finding-routing]')).toBeHidden();
  });

  test('reduced motion gives the result without routing @mobile', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('about/');
    await page.getByRole('button', { name: 'Review the evidence' }).click();
    await expect(page.locator('[data-finding]')).toHaveAttribute('data-processing', 'complete');
    await expect(page.locator('[data-finding-routing]')).toBeHidden();
  });

  test('profile requests enter allocation with the requested destination selected @mobile', async ({
    page,
  }) => {
    await page.goto('./');
    const profile = page.locator('a[data-allocate="github"]');
    await expect(profile).toHaveAttribute('href', 'https://github.com/DavidPurvis');
    await profile.click();
    await expect(page).toHaveURL(/\/casino\/\?dest=github$/);
    await expect(page.locator('[data-pick="github"]')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('[data-spin]')).toHaveAttribute('aria-disabled', 'false');
  });

  test('modified profile activations and Direct access are not intercepted', async ({ page }) => {
    await page.goto('./');
    // Prevent navigation after recording whether the application already intercepted the event.
    const attempt = (modified: boolean) =>
      page.locator('a[data-allocate="linkedin"]').evaluate((a, mod) => {
        let intercepted = false;
        const check = (e: MouseEvent) => {
          intercepted = e.defaultPrevented;
          e.preventDefault();
        };
        document.addEventListener('click', check, { once: true });
        a.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: mod }));
        return intercepted;
      }, modified);
    expect(await attempt(true)).toBe(false);
    await page.locator('header').getByRole('switch', { name: 'Direct access' }).click();
    expect(await attempt(false)).toBe(false);
  });

  for (const theme of ['light', 'dark'] as const) {
    test(`${theme}: paper and stamps remain legible at narrow widths and enlarged text @mobile`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme: theme });
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('./');
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      await expect(page.getByRole('link', { name: 'Open personnel file' })).toBeVisible();
      await page.goto('about/');
      await expect(page.locator('.finding__stamp')).toHaveCSS('mix-blend-mode', 'normal');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });
  }
});

test.describe('unassisted records', () => {
  test.use({ javaScriptEnabled: false });
  test('evidence and profile destinations exist without JavaScript', async ({ page }) => {
    await page.goto('./');
    await expect(page.locator('a[data-allocate="github"]')).toHaveAttribute(
      'href',
      'https://github.com/DavidPurvis',
    );
    await page.getByRole('link', { name: 'Open personnel file' }).click();
    await expect(page.getByText('Cart returned.')).toBeVisible();
    await expect(page.locator('[data-finding-routing]')).toBeHidden();
  });
});
