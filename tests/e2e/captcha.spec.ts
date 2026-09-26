import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

const verify = (page: Page) => page.locator('[data-cn-verify]');
async function submit(page: Page): Promise<void> {
  await expect(verify(page)).not.toHaveAttribute('aria-disabled', 'true');
  await verify(page).click();
}

test.describe('CAPTCHAN’T', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page));

  test('full ceremony: windows → cabbage → Linux → receipt → progress → continue @smoke', async ({
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
      'Please include windows that can be opened without administrator privileges.',
    );
    await expect(page.locator('[data-cn-subline]')).toHaveText('Incorrect. Please try again.');
    await submit(page);
    await expect(page.locator('[data-cn-headline]')).toHaveText(
      'You appear to be evaluating the walls between the windows.',
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
      'You missed one. It was a cabbage. They were all cabbages.',
    );
    await submit(page);
    await expect(page.locator('[data-cn-prompt]')).toContainText('Declaration of Independence');
    await submit(page);
    await expect(page.locator('[data-cn-subline]')).toHaveText(
      'Fine. You’ve proven you’re either human or extremely persistent, and both are hireable.',
    );
    await expect(page.locator('[data-cn-counter]')).toHaveText(
      'Attempts: 6. Attempts remaining: yes.',
    );

    await expect(page.locator('[data-cn-prompt]')).toContainText('Linux');
    await expect(
      page.getByText('No images supplied. Your task remains fully specified.'),
    ).toBeVisible();
    await submit(page);
    await expect(
      page.getByRole('heading', {
        name: /successfully refrained from installing a graphical interface/,
      }),
    ).toBeVisible();
    await expect(page.getByText('Method: abstinence (Linux)')).toBeVisible();
    await expect(page.getByText('⚠ Unsaved changes detected: your opinion of me.')).toBeVisible();

    await page.locator('[data-progress-skip]').click();
    const next = page.getByRole('link', { name: 'Continue to Character Review →' });
    await expect(next).toBeVisible();
    await done();
    // Navigating within the site after arming never shows the leave-site prompt. The Continue
    // link is "playful", so a consensual rickroll may intercept it (p = 0.25) — handle both.
    await next.click();
    const rick = page.getByRole('link', { name: 'Continue to where you were going →' });
    if (await rick.isVisible().catch(() => false)) await rick.click();
    await expect(page).toHaveURL(/\/about\/$/);
    expect(dialogs).toBe(0);
  });

  test('clicking Verify repeatedly during feedback counts once', async ({ page }) => {
    await page.goto('verify/');
    await verify(page).click();
    await verify(page).click({ force: true });
    await verify(page).click({ force: true });
    await expect(page.locator('[data-cn-counter]')).toHaveText(
      'Attempts: 1. Attempts remaining: yes.',
    );
  });

  test('audio challenge: transcribe the silence', async ({ page }) => {
    await page.goto('verify/');
    await page.getByText('🔈 Audio challenge').click();
    await page.getByRole('button', { name: 'Play the silence' }).click();
    const input = page.getByLabel('Transcribe the silence');
    await expect(input).toBeVisible({ timeout: 6000 });
    await page.getByRole('button', { name: 'Submit silence' }).click();
    await expect(page.getByText('Method: audio')).toBeVisible();
  });

  test('progress resumes mid-ceremony after reload', async ({ page }) => {
    await page.goto('verify/');
    for (let i = 0; i < 3; i++) await submit(page);
    await expect(page.locator('[data-cn-prompt]')).toContainText('Nicolas Cage');
    await page.reload();
    await expect(page.locator('[data-cn-prompt]')).toContainText('Nicolas Cage');
    await expect(page.locator('[data-cn-counter]')).toHaveText(
      'Attempts: 3. Attempts remaining: yes.',
    );
  });

  test('skip is always available and stationary', async ({ page }) => {
    await page.goto('verify/');
    const skip = page.getByRole('link', { name: 'Skip ceremonial CAPTCHA →' });
    await expect(skip).toHaveAttribute('href', /\/about\/\?skipped=1$/);
    await skip.click();
    await expect(page).toHaveURL(/\/about\/\?skipped=1$/);
  });
});
