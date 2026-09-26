import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

async function openModes(page: Page) {
  await page.locator('[data-dept-menu] > summary').click();
  return page.getByRole('switch', { name: 'Overkill HUD' });
}

test.describe('Overkill HUD', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
  });

  test('switches on from Modes, persists across pages, and switches off @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    await page.goto('about/');
    await expect(page.locator('[data-hud]')).toHaveCount(0);
    const sw = await openModes(page);
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    const hud = page.locator('[data-hud]');
    await expect(hud).toBeVisible();
    await expect(page.locator('html')).toHaveClass(/hud-on/);
    await expect(hud.getByRole('navigation', { name: 'Hotbar' }).getByRole('link')).toHaveCount(9);

    // The choice persists: the next page loads with the HUD already on.
    await page.goto('skills/');
    await expect(page.locator('[data-hud]')).toBeVisible();

    // Its own off switch removes everything and returns focus to the Modes menu.
    await page.getByRole('button', { name: 'HUD: off' }).click();
    await expect(page.locator('[data-hud]')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/hud-on/);
    await expect(page.locator('[data-dept-menu] > summary')).toBeFocused();
    const prefs = await page.evaluate(() => localStorage.getItem('uvcr:prefs'));
    expect(JSON.parse(prefs ?? '{}').hud).toBe('off');
    await done();
  });

  test.describe('with the HUD on', () => {
    test.beforeEach(async ({ page }) => {
      await seedPrefs(page, { hud: 'overkill' });
    });

    test('the page stays usable in the middle, and axe stays clean', async ({ page }) => {
      await page.goto('about/');
      await expect(page.locator('[data-hud]')).toBeVisible();
      const appendix = page.locator('[data-appendix] summary');
      await appendix.scrollIntoViewIfNeeded();
      await appendix.click();
      await expect(page.locator('[data-appendix]')).toHaveAttribute('open', '');

      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(
        violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => v.id),
      ).toEqual([]);
    });

    test('Department events land in the kill feed', async ({ page, viewport }) => {
      test.skip((viewport?.width ?? 0) < 1280, 'the kill feed lives in the wide-screen gutter');
      await page.goto('about/');
      await page.locator('[data-appendix] summary').click();
      await expect(page.locator('.hud-feed')).toContainText('You ⌖ The Appendix');
    });

    test('Recruiter Mode takes it down, and chaos brings it back', async ({ page }) => {
      await page.goto('skills/');
      await expect(page.locator('[data-hud]')).toBeVisible();
      await page.getByRole('switch', { name: 'Recruiter Mode' }).click();
      await expect(page.locator('[data-hud]')).toHaveCount(0);
      await expect(page.locator('html')).not.toHaveClass(/hud-on/);
      await page.getByRole('switch', { name: 'Recruiter Mode' }).click();
      await expect(page.locator('[data-hud]')).toBeVisible();
    });

    test('sincere pages and the résumé never get it', async ({ page }) => {
      await page.goto('tribute/');
      await page.locator('[data-dept-menu] > summary').click();
      await expect(page.getByRole('switch', { name: 'Overkill HUD' })).toBeHidden();
      await expect(page.locator('[data-hud]')).toHaveCount(0);
      await page.goto('resume/');
      await expect(page.locator('[data-hud]')).toHaveCount(0);
    });

    test('nothing scrolls sideways at 320px', async ({ page }) => {
      await page.setViewportSize({ width: 320, height: 640 });
      for (const r of ['skills/', 'about/', 'casino/', 'tailor/']) {
        await page.goto(r);
        await expect(page.locator('[data-hud]')).toBeVisible();
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth - innerWidth),
          r,
        ).toBe(0);
      }
    });

    test('printing still prints only the résumé', async ({ page }) => {
      await page.goto('about/');
      await expect(page.locator('[data-hud]')).toBeVisible();
      await page.emulateMedia({ media: 'print' });
      await expect(page.locator('[data-hud]')).toBeHidden();
      await expect(page.locator('.print-only .resume')).toBeVisible();
    });
  });

  test('the HUD code only downloads when it is switched on', async ({ page }) => {
    const scripts: string[] = [];
    page.on('request', (r) => {
      if (r.resourceType() === 'script' || r.resourceType() === 'stylesheet') scripts.push(r.url());
    });
    await page.goto('about/');
    await page.waitForLoadState('networkidle');
    const before = scripts.length;
    const sw = await openModes(page);
    await sw.click();
    await expect(page.locator('[data-hud]')).toBeVisible();
    expect(scripts.length).toBeGreaterThan(before);
  });
});
