import { expect, test } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

test.use({ timezoneId: 'America/Denver', locale: 'en-US' });

test.describe('legally binding vibes', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { threat: 2 });
  });

  test('part 1 lists the real storage keys and Reset everything deletes them @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    await page.goto('legal/');
    const rows = page.locator('[data-storage-rows] tr');
    await expect(rows.filter({ hasText: 'uvcr:prefs' })).toHaveCount(1);
    await expect(rows.filter({ hasText: 'uvcr:session' })).toHaveCount(1);
    await page.getByRole('button', { name: 'Reset everything' }).click();
    const left = await page.evaluate(() =>
      [
        ...Object.keys(localStorage),
        ...Object.keys(sessionStorage).filter((k) => !k.startsWith('__seeded')),
      ].filter((k) => k.startsWith('uvcr:')),
    );
    expect(left).toEqual([]);
    await expect(rows.filter({ hasText: 'uvcr:' })).toHaveCount(0);
    await expect(
      page.getByRole('status').filter({ hasText: 'The Department feels lighter.' }),
    ).toBeVisible();
    expect(await page.context().cookies()).toEqual([]);
    await done();
  });

  test('part 1 says what can load from elsewhere, and exactly when @smoke', async ({ page }) => {
    await page.goto('legal/');
    const part1 = page.locator('section[aria-labelledby="part1"]');
    // Everything the site can fetch or hand off beyond itself, each gated on a click.
    for (const fact of [
      /YouTube’s privacy-enhanced player loads/,
      /summon gameplay in Attention-Span Mode/,
      /link to claude\.ai .* Nothing goes to Claude unless you press that link/,
      /DOOM, on \/doom\/ and in the docked player, comes from this site too/,
      /downloaded only when you press Play/,
    ])
      await expect(part1).toContainText(fact);
  });

  test('the Terms of Reading grow until §4.2, then unlock', async ({ page }) => {
    await page.goto('legal/');
    const accept = page.getByRole('button', { name: 'I have read this sentence' });
    await expect(accept).toHaveAttribute('aria-disabled', 'true');
    await accept.dispatchEvent('click'); // clicking early does nothing
    await expect(page.locator('[data-tos-receipt]')).toBeEmpty();
    const box = page.locator('[data-tos]');
    const heights: number[] = [];
    for (let i = 0; i < 12; i++) {
      heights.push(await box.evaluate((el) => el.scrollHeight));
      await box.evaluate((el) => (el.scrollTop = el.scrollHeight));
      await page.waitForTimeout(120);
    }
    expect(Math.max(...heights)).toBeGreaterThan(heights[0]!);
    await expect(box.locator('p').last()).toHaveText(
      '§4.2 By reading this sentence you agree to have read this sentence.',
    );
    await expect(box.locator('[data-tos-more] p')).toHaveCount(6);
    await expect(accept).not.toHaveAttribute('aria-disabled', 'true');
    await accept.click();
    await expect(page.locator('[data-tos-receipt]')).toHaveText(
      'Agreement recorded nowhere. Congratulations on your reading.',
    );
  });

  test('detected lines are computed locally, with no network calls', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-23T10:15:00-06:00')); // a Wednesday, 10:15 MDT
    const requests: { url: string; type: string }[] = [];
    page.on('request', (r) => requests.push({ url: r.url(), type: r.resourceType() }));
    await page.goto('legal/');
    const d = page.locator('[data-detected]');
    await expect(d.locator('[data-detect]')).toHaveCount(7);
    await expect(d).toContainText('10:15 in America/Denver');
    await expect(d).toContainText('company time');
    await expect(d).toContainText('en-US');
    await d.getByText('How this works').nth(2).click();
    await expect(d).toContainText('Not your location.');
    // Only the page's own static files load: nothing leaves the origin, nothing is fetched by script.
    expect(requests.filter((r) => new URL(r.url).hostname !== '127.0.0.1')).toEqual([]);
    expect(
      requests.filter((r) => ['fetch', 'xhr', 'websocket', 'eventsource', 'ping'].includes(r.type)),
    ).toEqual([]);
  });

  test('after hours reads differently', async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-09-26T10:15:00-06:00')); // Saturday
    await page.goto('legal/');
    await expect(page.locator('[data-detected]')).toContainText('After hours?');
  });

  test('stickers answer, and the one real notification fires exactly once', async ({
    page,
    context,
    browserName,
  }) => {
    test.skip(browserName !== 'chromium', 'notification permission granting is Chromium-only here');
    await context.grantPermissions(['notifications']);
    await page.addInitScript(() => {
      const Real = window.Notification;
      let count = Number(sessionStorage.getItem('__notes') || '0');
      class Spy extends Real {
        constructor(title: string, o?: NotificationOptions) {
          super(title, o);
          count += 1;
          sessionStorage.setItem('__notes', String(count));
        }
      }
      Object.defineProperty(window, 'Notification', { value: Spy, configurable: true });
    });
    await page.goto('legal/');
    await page
      .locator('[data-sticker="location"]')
      .getByRole('button', { name: 'Allow, but sadly' })
      .click();
    await expect(page.locator('[data-sticker="location"] [data-sticker-result]')).toContainText(
      'You are: here.',
    );
    const btn = page.getByRole('button', { name: /Enable notifications of my feelings/ });
    await btn.click();
    await expect(page.locator('[data-notify-result]')).toHaveText(
      'Delivered. That was the only one. Ever.',
    );
    await expect(btn).toBeHidden();
    await page.reload();
    await expect(btn).toBeHidden();
    await expect(page.locator('[data-notify-result]')).toContainText('already delivered');
    expect(await page.evaluate(() => sessionStorage.getItem('__notes'))).toBe('1');
  });

  test('unverified Meta quotes never render', async ({ page }) => {
    await page.goto('legal/');
    await expect(page.locator('body')).not.toContainText(/Instagram|Meta Platforms/);
  });

  test('works without JavaScript: facts render, games degrade', async ({ browser }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('legal/');
    await expect(page.getByText('This site sets no cookies.', { exact: false })).toBeVisible();
    await ctx.close();
  });
});
