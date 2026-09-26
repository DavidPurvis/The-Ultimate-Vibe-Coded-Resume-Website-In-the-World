import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';
import { checkResumeText } from '../../src/lib/integrity';
import { LEDGER } from '../../src/content/credits';

test.beforeEach(async ({ page }) => {
  await seedPrefs(page, {}, { identityPrompted: true });
});

test.describe('contact (theoretically)', () => {
  test('the phone slider speaks formatted numbers and sends nothing', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('contact/');
    const slider = page.getByRole('slider', { name: 'Phone number (required, apparently)' });
    await slider.focus();
    await page.keyboard.press('ArrowRight');
    await expect(slider).toHaveAttribute('aria-valuetext', '(000) 000-0001');
    await expect(page.locator('[data-phone-out]')).toHaveText('(000) 000-0001');
    await page.keyboard.press('End');
    await expect(slider).toHaveAttribute('aria-valuetext', '(999) 999-9999');
    await page.getByRole('button', { name: 'Close enough' }).click();
    await expect(page.locator('[data-phone-result]')).toContainText('Nothing was sent.');
    await done();
  });

  test('the email drum composes one character at a time and celebrates @', async ({ page }) => {
    await page.goto('contact/');
    const drum = page.getByRole('spinbutton', { name: 'Email address, one character at a time' });
    await drum.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-drum-out]')).toHaveText('a');
    for (let i = 0; i < 4; i++) await page.keyboard.press('ArrowUp'); // wraps: - _ . @
    await expect(drum).toHaveAttribute('aria-valuetext', '@');
    await expect(page.getByRole('status').filter({ hasText: 'MILESTONE' })).toBeVisible();
    await page.getByRole('button', { name: 'Add letter' }).click();
    await expect(page.locator('[data-drum-out]')).toHaveText('a@');
    await page.getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('[data-drum-out]')).toHaveText('a');
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('[data-drum-result]')).toContainText('decorative the whole time');
  });

  test('the cowardly route goes through the casino', async ({ page }) => {
    await page.goto('contact/');
    await expect(page.getByRole('link', { name: 'or, like a coward, email me' })).toHaveAttribute(
      'href',
      /\/casino\/\?dest=email$/,
    );
  });
});

test.describe('case files', () => {
  test('rendered project text passes the integrity guard @smoke', async ({ page }) => {
    await page.goto('projects/');
    // Every claim on the page (names, stacks, descriptions, known issues); form IDs are chrome.
    const claims = await page
      .locator('[data-case-files] article > :not(.card__form-id)')
      .allInnerTexts();
    expect(claims.length).toBeGreaterThan(12);
    expect(checkResumeText(claims.join('\n'), 'projects')).toEqual([]);
    for (const id of ['car-thing', 'stream-deck', 'homelab', 'dashboard'])
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator('#car-thing')).toContainText('Known issue');
    await expect(page.getByRole('link', { name: 'Gamble for the GitHub link' })).toHaveAttribute(
      'href',
      /\/casino\/\?dest=github$/,
    );
  });
});

test.describe('how this was built', () => {
  test('every section discloses a limitation; Inspect me toggles and reverts', async ({ page }) => {
    const done = await watchErrors(page);
    await page.clock.install();
    await page.goto('how-it-was-built/');
    const sections = page.locator('section.disclosure');
    const limits = page.locator('aside.limitation');
    expect(await limits.count()).toBe((await sections.count()) - 1);
    const btn = page.getByRole('button', { name: 'Inspect me' });
    await btn.click();
    await expect(page.locator('html')).toHaveClass(/inspected/);
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#announcer')).toContainText('Unauthorized inspection detected.');
    await page.clock.runFor(6100);
    await expect(page.locator('html')).not.toHaveClass(/inspected/);
    await btn.click();
    await btn.click();
    await expect(page.locator('html')).not.toHaveClass(/inspected/);
    await done();
  });
});

test.describe('credits', () => {
  test('every ledger file is served and the CC BY attribution is present @smoke', async ({
    page,
    request,
  }) => {
    await page.goto('credits/');
    await expect(
      page.getByText('Icons by the game-icons.net contributors, licensed under CC BY 3.0.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'game-icons.net' })).toHaveAttribute(
      'href',
      'https://game-icons.net/',
    );
    const files = LEDGER.flatMap((e) => e.files ?? []);
    expect(files.length).toBeGreaterThan(20);
    for (const f of files) expect((await request.get(f)).status(), f).toBe(200);
  });
});

test.describe('404', () => {
  test('unknown paths get a real 404 with stationary exits @smoke', async ({ page, request }) => {
    expect((await request.get('definitely-not-a-page/')).status()).toBe(404);
    await page.goto('definitely-not-a-page/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      '404: This page failed the CAPTCHA.',
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await page.getByRole('link', { name: 'Résumé', exact: true }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });

  test('"Go home (fast)" dodges the mouse at most three times, then works', async ({ page }) => {
    await page.goto('definitely-not-a-page/');
    const fast = page.locator('[data-nf-fast]');
    const boxes: string[] = [];
    for (let i = 0; i < 6; i++) {
      const b = await fast.boundingBox();
      if (!b) throw new Error('no box');
      boxes.push(`${Math.round(b.x)},${Math.round(b.y)}`);
      await page.mouse.move(b.x - 200, b.y - 200);
      await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 8 });
      await page.waitForTimeout(350);
    }
    expect(new Set(boxes).size).toBeLessThanOrEqual(4);
    await expect(fast).toHaveText('ok go home');
    await fast.click();
    await expect(page).toHaveURL(/World\/$/);
  });

  test('keyboard never makes it run', async ({ page }) => {
    await page.goto('definitely-not-a-page/');
    const fast = page.locator('[data-nf-fast]');
    const before = await fast.boundingBox();
    await fast.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/World\/$/);
    expect(before).not.toBeNull();
  });
});
