import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from '../helpers';

test.describe('character review, loadout, research, causes', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('about: stamps reveal evidence; the appendix is buried and labelled fiction @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    await page.goto('about/');
    await expect(page.getByRole('heading', { level: 1, name: 'Character Review' })).toBeVisible();

    const firstStamp = page.locator('[data-flag-toggle]').first();
    await expect(firstStamp).toHaveAttribute('aria-expanded', 'false');
    const panel = page.locator(`#${await firstStamp.getAttribute('aria-controls')}`);
    await expect(panel).toBeHidden();
    await firstStamp.click();
    await expect(firstStamp).toHaveAttribute('aria-expanded', 'true');
    await expect(panel).toBeVisible();

    const appendix = page.locator('[data-appendix]');
    await expect(appendix).not.toHaveAttribute('open', '');
    await expect(page.getByText('My mom is my alibi.')).toBeHidden();
    await appendix.locator('summary').click();
    await expect(appendix.getByText('FICTIONAL AUDIT · SELF-REPORTED').first()).toBeVisible();
    const alibiStamp = appendix.locator('[data-flag-toggle]').nth(1);
    await alibiStamp.click();
    await expect(page.getByText('My mom is my alibi.')).toBeVisible();
    expect(
      await page.evaluate(() => JSON.parse(sessionStorage.getItem('uvcr:session')!).threat),
    ).toBe(1);
    await done();
  });

  test('about: a skipped verification is recorded where it happened, not announced here', async ({
    page,
  }) => {
    await page.goto('about/?skipped=1');
    await expect(page.locator('[data-skipped-receipt]')).toHaveCount(0);
    await expect(page.locator('[data-notice-slot] [data-notice]')).toHaveCount(0);
  });

  test('form numbers skip 7 everywhere on the review page', async ({ page }) => {
    await page.goto('about/');
    const html = await page.content();
    expect(html).not.toMatch(/DDP-7\b|DDP-3\/07\b/);
  });

  test('skills: Inspect flips a skin to its real evidence', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('skills/');
    const btn = page.locator('[data-inspect]').first();
    const back = page.locator(`#${await btn.getAttribute('aria-controls')}`);
    await expect(back).toBeHidden();
    await btn.click();
    await expect(back).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    await btn.click();
    await expect(back).toBeHidden();
    await expect(page.getByRole('table')).toHaveCount(1);
    await expect(
      page.locator('.matrix').getByRole('img', { name: 'Stamp: Fabricated' }),
    ).toHaveCount(7);
    await expect(page.locator('.rafting li')).toHaveCount(5);
    await done();
  });

  test('beliefs: wheel scrolling inverts inside the Upside Down only', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('beliefs/');
    await expect(page.locator('[data-upside-disabled]')).toBeHidden();
    const box = page.locator('[data-upside]');
    await box.evaluate((el) => (el.scrollTop = 200));
    await box.hover();
    await page.mouse.wheel(0, 100);
    await expect.poll(() => box.evaluate((el) => el.scrollTop)).toBe(100);
    // Outside the box, the page scrolls the normal way.
    await page.mouse.move(5, 5);
    const before = await page.evaluate(() => scrollY);
    await page.mouse.wheel(0, 150);
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before);
    await done();
  });

  test('beliefs: no item 7, and inversion is off under reduced motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('beliefs/');
    await expect(page.locator('[data-upside-disabled]')).toBeVisible();
    await expect(page.locator('ol.positions li[value="7"]')).toHaveCount(0);
  });

  test('support: gravity collapses with transforms only, and Rebuild restores exactly', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    await page.goto('support/');
    const cards = page.locator('[data-gravity]');
    const n = await cards.count();
    expect(n).toBeGreaterThan(3);
    await page.getByRole('button', { name: 'Don’t press this.' }).click();
    const rebuild = page.getByRole('button', { name: 'Rebuild page' });
    await expect(rebuild).toBeVisible();
    await expect(page.locator('.gravity-overlay')).toHaveCount(1);
    await expect(page.locator('html')).toHaveClass(/gravity-lock/);
    await expect
      .poll(() => cards.first().evaluate((el) => el.style.transform), { timeout: 3000 })
      .toMatch(/translate\(.*rotate/);
    await rebuild.click();
    await expect(page.locator('.gravity-overlay')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/gravity-lock/);
    for (let i = 0; i < n; i++)
      expect(await cards.nth(i).evaluate((el) => el.style.transform)).toBe('');
    await expect(page.getByText('Structural integrity restored.', { exact: false })).toBeVisible();
    await done();
  });

  test('support: reduced motion never downloads the physics engine', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const chunks: string[] = [];
    page.on('request', (r) => chunks.push(r.url()));
    await page.goto('support/');
    await page.getByRole('button', { name: 'Don’t press this.' }).click();
    await expect(page.locator('[data-gravity-note]')).toContainText('Motion is off');
    expect(chunks.filter((u) => /matter/i.test(u))).toEqual([]);
    await expect(page.locator('.gravity-overlay')).toHaveCount(0);
  });

  test('support: switching to Direct access mid-collapse tears everything down', async ({
    page,
  }) => {
    await page.goto('support/');
    await page.getByRole('button', { name: 'Don’t press this.' }).click();
    await expect(page.locator('.gravity-overlay')).toHaveCount(1);
    // The physics overlay covers the page; the footer switch is reached programmatically here
    // (keyboard users reach it by Tab, which the overlay doesn't block).
    await page
      .locator('header')
      .getByRole('switch', { name: 'Direct access' })
      .dispatchEvent('click');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
    await expect(page.locator('.gravity-overlay')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveClass(/gravity-lock/);
    const transforms = await page
      .locator('[data-gravity]')
      .evaluateAll((els) => els.map((e) => (e as HTMLElement).style.transform));
    expect(transforms.every((t) => t === '')).toBe(true);
  });
});
