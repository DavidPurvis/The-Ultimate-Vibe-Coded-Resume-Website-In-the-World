import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';
import { checkResumeText } from '../../src/lib/integrity';

const SLUGS = ['zipper-merge', 'national-security', 'thermite-mute', 'goldfish', 'ordained'];

test.describe('the Department Newsletter', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
  });

  test('index lists five posts with 7-free form numbers @smoke', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('blog/');
    const cards = page.locator('.post-card');
    await expect(cards).toHaveCount(5);
    const ids = await page.locator('.post-card .card__form-id').allInnerTexts();
    expect(ids.some((t) => /DRV-28\/\d*7/.test(t))).toBe(false);
    await cards.first().getByRole('link').click();
    await expect(page).toHaveURL(/\/blog\/zipper-merge\/$/);
    await done();
  });

  test('every post renders and passes the claim rules', async ({ page }) => {
    for (const slug of SLUGS) {
      await page.goto(`blog/${slug}/`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      const text = await page.locator('[data-post-body]').innerText();
      expect(checkResumeText(text, 'blog'), slug).toEqual([]);
    }
  });

  test('the rigged simulation: honest numbers, same verdict', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const done = await watchErrors(page);
    await page.goto('blog/zipper-merge/');
    await page.getByRole('button', { name: 'Run the simulation' }).click();
    const verdict = page.locator('.aem-sim__verdict');
    await expect(verdict).toContainText('Winner: Adaptive Early Merge, by vibes.');
    await expect(verdict).toContainText('basically a tie');
    await expect(page.locator('#announcer')).toContainText('by vibes');
    await done();
  });

  test('facts awaiting David stay hidden; the R6 card still links the tracker', async ({
    page,
  }) => {
    await page.goto('blog/national-security/');
    await expect(page.getByText('Applications submitted')).toHaveCount(0);
    await page.goto('blog/goldfish/');
    await expect(page.getByText('The fish’s name')).toHaveCount(0);
    await page.goto('blog/thermite-mute/');
    await expect(page.getByRole('link', { name: 'Full tracker profile ↗' })).toHaveAttribute(
      'href',
      /r6\.tracker\.network/,
    );
  });

  test('RSS: five items with absolute links', async ({ request }) => {
    const res = await request.get('blog/rss.xml');
    expect(res.headers()['content-type']).toMatch(/xml/);
    const xml = await res.text();
    expect((xml.match(/<item>/g) ?? []).length).toBe(5);
    expect(xml).toMatch(/<link>https:\/\/[^<]+\/blog\/zipper-merge\/<\/link>/);
  });

  test('prev/next navigation walks the newsletter', async ({ page }) => {
    await page.goto('blog/national-security/');
    await page
      .getByRole('navigation', { name: 'More newsletters' })
      .getByRole('link', { name: /Next/ })
      .click();
    await expect(page).toHaveURL(/\/blog\/thermite-mute\/$/);
  });
});
