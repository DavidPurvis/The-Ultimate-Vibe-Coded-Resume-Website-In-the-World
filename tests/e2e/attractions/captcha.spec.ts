/**
 * Verification: the window grid, the cabbage round, the empty Linux round and the silent audio
 * challenge, with calm administrative objections and "Review complete." A skip is available at
 * every point and is recorded as a skip, nothing more.
 */
import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from '../helpers';

const verify = (page: Page) => page.locator('[data-cn-verify]');
async function submit(page: Page): Promise<void> {
  await expect(verify(page)).not.toHaveAttribute('aria-disabled', 'true');
  await verify(page).click();
}
const captcha = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('uvcr:session') ?? '{}').captcha);

test.describe('verification', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page));

  test('windows → cabbages → Linux → Review complete. → progress → Character Review @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    let dialogs = 0;
    page.on('dialog', async (d) => {
      dialogs++;
      await d.dismiss();
    });
    await page.goto('verify/');
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
    await expect(page.getByText('Verify you are human')).toHaveCount(0);

    await page.locator('[data-tile="browser"]').click();
    await page.locator('[data-tile="terminal"]').click();
    await expect(page.locator('[data-tile="browser"]')).toHaveAttribute('aria-pressed', 'true');
    await submit(page);
    await expect(page.locator('[data-cn-headline]')).toHaveText(
      'Please include windows that open without administrator privileges.',
    );
    await expect(page.locator('[data-cn-subline]')).toHaveText(
      'The selection has been returned for correction.',
    );
    await submit(page);
    await expect(page.locator('[data-cn-headline]')).toHaveText(
      'The walls between the windows have been reviewed. The windows have not.',
    );
    await submit(page);
    await expect(page.locator('[data-cn-prompt]')).toContainText('Nicolas Cage');
    await expect(page.locator('[data-tile] img').first()).toHaveAttribute(
      'alt',
      'A legally nervous grey rectangle',
    );

    await page.locator('[data-tile]').first().click();
    await expect(page.locator('[data-tile] img').first()).toHaveAttribute(
      'alt',
      /^Nicolas Cabbage wearing/,
    );
    await submit(page);
    await expect(page.locator('[data-cn-headline]')).toHaveText(
      'One tile was missed. It was a cabbage. Every tile was a cabbage.',
    );
    await submit(page);
    await expect(page.locator('[data-cn-prompt]')).toContainText('Declaration of Independence');
    await submit(page);
    await expect(page.locator('[data-cn-subline]')).toHaveText(
      'Persistence has been accepted as evidence of humanity. The review will conclude.',
    );
    await expect(page.locator('[data-cn-counter]')).toHaveText(
      'Attempts: 6. Attempts remaining: yes.',
    );

    await expect(page.locator('[data-cn-prompt]')).toContainText('Linux');
    await expect(
      page.getByText('No images supplied. Your task remains fully specified.'),
    ).toBeVisible();
    await submit(page);
    const heading = page.getByRole('heading', { name: 'Review complete.' });
    await expect(heading).toBeVisible();
    await expect(heading).toBeFocused();
    await expect(page.locator('[data-cn-done-headline]')).toHaveText(
      'Correct. No graphical interface was installed.',
    );
    await expect(page.getByText('Method: abstinence (Linux)')).toBeVisible();
    expect(await captcha(page)).toMatchObject({ completed: true, method: 'linux' });

    await page.locator('[data-progress-skip]').click();
    const next = page.getByRole('link', { name: 'Visit Character Review' });
    await expect(next).toBeVisible();
    await next.click();
    await expect(page).toHaveURL(/\/about\/$/);
    expect(dialogs).toBe(0);
    await done();
  });

  test('clicking Verify repeatedly during an objection counts once', async ({ page }) => {
    await page.goto('verify/');
    await verify(page).click();
    await verify(page).click({ force: true });
    await verify(page).click({ force: true });
    await expect(page.locator('[data-cn-counter]')).toHaveText(
      'Attempts: 1. Attempts remaining: yes.',
    );
  });

  test('Direct access during an objection leaves nothing locked or running', async ({ page }) => {
    await page.goto('verify/');
    await verify(page).click();
    await expect(verify(page)).toHaveAttribute('aria-disabled', 'true');
    await page.locator('header').getByRole('switch', { name: 'Direct access' }).click();
    await expect(verify(page)).not.toHaveAttribute('aria-disabled', 'true');
    await expect(page.locator('.cn__tile.is-fading')).toHaveCount(0);
  });

  test('audio challenge: transcribe the silence', async ({ page }) => {
    await page.goto('verify/');
    await page.getByText('🔈 Audio challenge').click();
    await page.getByRole('button', { name: 'Play the silence' }).click();
    const input = page.getByLabel('Transcribe the silence');
    await expect(input).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: 'Submit silence' }).click();
    await expect(page.getByRole('heading', { name: 'Review complete.' })).toBeVisible();
    await expect(page.getByText('Method: audio')).toBeVisible();
  });

  test('progress resumes mid-review after reload', async ({ page }) => {
    await page.goto('verify/');
    for (let i = 0; i < 3; i++) await submit(page);
    await expect(page.locator('[data-cn-prompt]')).toContainText('Nicolas Cage');
    await page.reload();
    await expect(page.locator('[data-cn-prompt]')).toContainText('Nicolas Cage');
    await expect(page.locator('[data-cn-counter]')).toHaveText(
      'Attempts: 3. Attempts remaining: yes.',
    );
  });

  test('skipping is always available, stays put, and is recorded as a skip', async ({ page }) => {
    await page.goto('verify/');
    const skip = page.getByRole('button', { name: 'Skip verification' });
    // Stationary: approaching it never moves it (a hover lift of a pixel or so aside).
    await skip.scrollIntoViewIfNeeded();
    const before = await skip.boundingBox();
    await skip.hover();
    const after = await skip.boundingBox();
    expect(Math.abs((after?.x ?? 0) - (before?.x ?? 0))).toBeLessThan(2);
    expect(Math.abs((after?.y ?? 0) - (before?.y ?? 0))).toBeLessThan(3);
    await expect(skip).not.toHaveClass(/runaway/);
    await skip.click();
    const heading = page.getByRole('heading', { name: 'Verification skipped.' });
    await expect(heading).toBeFocused();
    expect(await captcha(page)).toMatchObject({ completed: false, method: 'skipped' });
    await page.reload();
    await expect(heading).toBeVisible();
  });
});
