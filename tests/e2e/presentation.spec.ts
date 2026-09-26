import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';
import { checkResumeText } from '../../src/lib/integrity';

test.describe('Résumé.ppt', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
  });

  test('the slides carry the real résumé, verbatim enough to pass the integrity guard @smoke', async ({
    page,
  }) => {
    await page.goto('presentation/');
    const text = (await page.locator('[data-slide-content]').allInnerTexts()).join('\n');
    expect(checkResumeText(text, 'resume')).toEqual([]);
    expect(text).toContain('Magna Cum Laude');
    expect(text).toContain('Software Developer Intern, Fiber Billing');
  });

  test('scrolling brings every slide in, with at most three ad-libs at once', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('presentation/');
    const slides = page.locator('[data-slide]');
    const n = await slides.count();
    expect(n).toBeGreaterThan(6);
    let maxBursts = 0;
    for (let i = 0; i < n; i++) {
      await slides.nth(i).scrollIntoViewIfNeeded();
      await expect(slides.nth(i)).toHaveClass(/is-in/);
      maxBursts = Math.max(maxBursts, await page.locator('.burst:not(.is-leaving)').count());
    }
    expect(maxBursts).toBeGreaterThan(0);
    expect(maxBursts).toBeLessThanOrEqual(3);
    const bursts = page.locator('.burst');
    if (await bursts.count()) await expect(bursts.first()).toHaveAttribute('aria-hidden', 'true');
    await done();
  });

  test('slide numbers skip 7', async ({ page }) => {
    await page.goto('presentation/');
    const nums = await page.locator('.slide__num').allInnerTexts();
    expect(nums.some((t) => /\b\d*7\d*\b/.test(t))).toBe(false);
    expect(nums).toContain('Slide 8');
  });

  test('reduced motion: every slide is simply there, and nothing pops', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('presentation/');
    const n = await page.locator('[data-slide]').count();
    await expect(page.locator('[data-slide].is-in')).toHaveCount(n);
    await page.locator('[data-slide]').last().scrollIntoViewIfNeeded();
    await expect(page.locator('.burst')).toHaveCount(0);
  });

  test('without JavaScript the deck is a still, readable document', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto('presentation/');
    const opacities = await p
      .locator('.slide__frame')
      .evaluateAll((els) => els.map((e) => getComputedStyle(e).opacity));
    expect(opacities.every((o) => o === '1')).toBe(true);
    await ctx.close();
  });

  test('Recruiter Mode: transitions stay, ad-libs stop', async ({ page }) => {
    await seedPrefs(page, { mode: 'recruiter' });
    await page.goto('presentation/');
    for (const s of await page.locator('[data-slide]').all()) await s.scrollIntoViewIfNeeded();
    await expect(page.locator('.burst')).toHaveCount(0);
  });
});
