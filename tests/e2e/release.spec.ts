/**
 * Request résumé in a real browser: the three views, approval without prerequisites, the ordinary
 * résumé at the end, and the ways around it (modified clicks, Direct access, no JavaScript). Also
 * the handoff's creative journeys J1–J3 as far as a test can walk them.
 */
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

const dialog = (page: Page) => page.locator('#release');
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('uvcr:session') ?? '{}'));
async function serious(page: Page): Promise<string[]> {
  const { violations } = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map((v) => v.id);
}

test.describe('résumé release', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page));

  test('J2: cube → DOOM → Request résumé → Approved. → the ordinary résumé @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    // Recreation works on its own, entered directly. Wait for the cube's engine to arrive (drawn,
    // or its drawing kept where the browser has no WebGL) so nothing is left half-loaded.
    await page.goto('cube/');
    await expect(page.locator('[data-cube-stage] canvas[data-engine]')).toBeAttached({
      timeout: 20_000,
    });
    await page.goto('doom/');
    await expect(page.getByRole('button', { name: '▶ Play DOOM' })).toBeVisible();
    await page.goto('./');
    const request = page.getByRole('link', { name: 'Request résumé' });
    await request.click();
    await expect(dialog(page)).toBeVisible();
    await expect(dialog(page).getByRole('heading', { name: 'Résumé request' })).toBeFocused();
    await expect(dialog(page)).toContainText('You are requesting David Purvis’s résumé.');
    expect(await serious(page)).toEqual([]);

    await dialog(page).getByRole('button', { name: 'Confirm request' }).click();
    await expect(dialog(page).getByRole('heading', { name: 'Request confirmation' })).toBeFocused();
    expect(await serious(page)).toEqual([]);
    await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();

    await expect(dialog(page).getByRole('heading', { name: 'Determination' })).toBeFocused();
    await expect(dialog(page)).toContainText('3 departments consulted.');
    await expect(dialog(page)).toContainText('No supporting declarations were supplied.');
    await expect(dialog(page).locator('.release__approved')).toHaveText('Approved.');
    expect(await serious(page)).toEqual([]);
    expect((await session(page)).caseFile.released).toBe(true);
    // Nothing navigates by itself.
    await page.waitForTimeout(300);
    await expect(page).toHaveURL(/\/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World\/$/);

    await dialog(page).getByRole('link', { name: 'Open résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('David Purvis');
    await expect(page.locator('[data-case-bar], [data-notice-slot], #release')).toHaveCount(0);

    // Coming back, exploration continues, and the next request goes straight through.
    await page.goto('./');
    await expect(page.locator('[data-status-text]')).toBeVisible();
    await page.getByRole('link', { name: 'Request résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await done();
  });

  test('J1 ends with an approval that cites the skip', async ({ page }) => {
    await page.goto('about/');
    await page.goto('verify/');
    await page.getByRole('button', { name: 'Skip verification' }).click();
    await page.goto('contact/');
    await page.goto('./');
    await page.getByRole('link', { name: 'Request résumé' }).click();
    await dialog(page).getByRole('button', { name: 'Confirm request' }).click();
    await dialog(page).getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(dialog(page)).toContainText('4 departments consulted.');
    await expect(dialog(page)).toContainText('Verification: skipped.');
    await expect(dialog(page)).not.toContainText('No supporting declarations');
  });

  test('every view offers the direct link and a close; Escape costs nothing', async ({ page }) => {
    await page.goto('./');
    const request = page.getByRole('link', { name: 'Request résumé' });
    await request.click();
    for (const next of ['Confirm request', 'Confirm']) {
      await expect(
        dialog(page).getByRole('link', { name: 'Go directly to résumé' }),
      ).toHaveAttribute('href', /\/resume\/$/);
      await expect(dialog(page).getByRole('button', { name: 'Close' })).toBeVisible();
      await dialog(page).getByRole('button', { name: next, exact: true }).click();
    }
    await expect(dialog(page).getByRole('link', { name: 'Go directly to résumé' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog(page)).toHaveCount(0);
    await expect(request).toBeFocused();

    // An early close: no approval, and the next request starts over.
    await page.evaluate(() => sessionStorage.clear());
    await request.click();
    await dialog(page).getByRole('button', { name: 'Confirm request' }).click();
    await dialog(page).getByRole('button', { name: 'Close' }).click();
    expect((await session(page)).caseFile?.released ?? false).toBe(false);
    await request.click();
    await expect(dialog(page).getByRole('heading', { name: 'Résumé request' })).toBeVisible();
  });

  test('a modified click keeps its native meaning', async ({ page, context }) => {
    await page.goto('./');
    const opened = context.waitForEvent('page');
    await page
      .getByRole('link', { name: 'Request résumé' })
      .click({ modifiers: [process.platform === 'darwin' ? 'Meta' : 'Control'] });
    const tab = await opened;
    // A new tab starts at about:blank before it navigates.
    await tab.waitForURL(/\/resume\/$/);
    await expect(dialog(page)).toHaveCount(0);
  });

  test('Direct access closes an open procedure and leaves the link as a link', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Request résumé' }).click();
    await expect(dialog(page)).toBeVisible();
    await page
      .locator('header')
      .getByRole('switch', { name: 'Direct access' })
      .dispatchEvent('click');
    await expect(dialog(page)).toHaveCount(0);
    await page.getByRole('link', { name: 'Request résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });
});

test.describe('J3: without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the front desk’s résumé links are ordinary links @smoke', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'Go directly to résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('David Purvis');
  });
});
