/**
 * Hyperlink allocation. The first request always goes to review and the third is always
 * allocated, so the smoke path needs no forced samples; the specs that choose spin 2's outcome
 * are tagged @hooks and run against the test-hooks build.
 */
import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from '../helpers';

const GITHUB = 'https://github.com/DavidPurvis';
const session = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('uvcr:session') ?? '{}'));

async function stubYouTube(page: Page): Promise<void> {
  await page.route('https://www.youtube-nocookie.com/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
  );
}

async function spin(page: Page, forced?: number): Promise<string> {
  if (forced !== undefined)
    await page.evaluate(
      (x) =>
        (window as unknown as { __uvcr: { forceSample(n: number): void } }).__uvcr.forceSample(x),
      forced,
    );
  await page.locator('[data-spin]').click();
  const result = page.locator('[data-casino-result]');
  await expect(result).toBeVisible({ timeout: 8000 });
  await expect(result).toBeFocused();
  return (await page.locator('[data-wheel]').getAttribute('data-outcome')) ?? '';
}

test.describe('hyperlink allocation', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
    await stubYouTube(page);
  });

  test('the request is pending, the first spin is reviewed, the third is allocated @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('casino/?dest=github');
    await expect(page.getByRole('button', { name: 'GitHub' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('[data-attempting]')).toHaveText(
      'The requested destination is available. Allocation is pending. Requested: GitHub (github.com/DavidPurvis).',
    );

    expect(await spin(page)).toBe('RICKROLL');
    const result = page.locator('[data-casino-result]');
    await expect(result).toContainText('Your request remains within the processing period.');
    await page.getByRole('button', { name: 'Review the musical material' }).click();
    const dialog = page.locator('#rickroll');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('iframe')).toHaveAttribute(
      'src',
      /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/,
    );
    await page.keyboard.press('Escape');
    await expect(dialog.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Review the musical material' })).toBeFocused();
    await expect(page.getByText('Your persistence has been added to the file.')).toBeVisible();
    expect((await session(page)).casinoLosses).toBe(1);

    const second = await spin(page);
    const third = await spin(page);
    expect(third).toBe('HYPERLINK');
    await expect(result).toContainText('Allocation complete.');
    const link = page.getByRole('link', { name: 'Open GitHub ↗' });
    await expect(link).toHaveAttribute('href', GITHUB);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const s = await session(page);
    expect(s.casino.github).toBe(3);
    // Only completed unsuccessful spins count: the first, and the second unless it paid.
    expect(s.casinoLosses).toBe(second === 'HYPERLINK' ? 1 : 2);
    await done();
  });

  test('an interrupted spin records the attempt but no loss', async ({ page }) => {
    await page.goto('casino/?dest=github');
    await page.locator('[data-spin]').click();
    await page.locator('header').getByRole('switch', { name: 'Direct access' }).click();
    await expect(page.locator('[data-casino]')).toBeHidden();
    await expect(
      page.getByText('Direct access is on. Every destination, without allocation:'),
    ).toBeVisible();
    await expect(page.locator('.recruiter-only [data-direct="github"]')).toHaveAttribute(
      'href',
      GITHUB,
    );
    await page.waitForTimeout(500);
    await expect(page.locator('[data-casino-result]')).toBeHidden();
    const s = await session(page);
    expect(s.casino.github).toBe(1);
    expect(s.casinoLosses).toBe(0);
  });

  test('a double click records one attempt, and cards lock while spinning', async ({ page }) => {
    await page.goto('casino/?dest=email');
    await page.locator('[data-spin]').dblclick();
    await expect(page.getByRole('button', { name: /^Email/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.locator('[data-casino-result]')).toBeVisible({ timeout: 8000 });
    expect((await session(page)).casino.email).toBe(1);
    await expect(page.getByRole('button', { name: /^Email/ })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  test('reduced motion lands in well under a second', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('casino/?dest=github');
    const t0 = Date.now();
    await page.locator('[data-spin]').click();
    await expect(page.locator('[data-casino-result]')).toBeVisible();
    expect(Date.now() - t0).toBeLessThan(1500);
  });

  test('without a destination, the Department asks for one', async ({ page }) => {
    await page.goto('casino/');
    await expect(page.locator('[data-spin]')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('[data-spin]').click({ force: true }); // aria-disabled, but people still click
    await expect(page.locator('[data-casino-status]')).toContainText(
      'Please select the information',
    );
    await expect(page.locator('[data-casino-result]')).toBeHidden();
  });

  test('responsible gambling goes straight to the résumé', async ({ page }) => {
    await page.goto('casino/');
    await page.getByRole('link', { name: '1-800-JUST-READ-THE-RESUME' }).click();
    await expect(page).toHaveURL(/\/resume\/\?mode=recruiter$/);
  });
});

test.describe('hyperlink allocation with chosen outcomes @hooks', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
    await stubYouTube(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('RIP: pay respects with F to revive the link', async ({ page }) => {
    await page.goto('casino/?dest=linkedin');
    await spin(page);
    expect(await spin(page, 0.5)).toBe('RIP');
    await expect(page.locator('.tomb__text')).toContainText('HERE LIES /in/dgp0');
    await page.locator('[data-casino-result]').press('f');
    await expect(
      page.getByText('F received. Hyperlink revived through community support.'),
    ).toBeVisible();
    await expect(page.locator('[data-real-link="linkedin"]')).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/dgp0',
    );
    await expect(page.locator('[data-real-link="linkedin"]')).toBeFocused();
    expect((await session(page)).casinoLosses).toBe(2);
  });

  test('allocation can come early on spin 2', async ({ page }) => {
    await page.goto('casino/?dest=pdf');
    await spin(page);
    expect(await spin(page, 0.82)).toBe('HYPERLINK');
    await expect(page.locator('[data-real-link="pdf"]')).toHaveAttribute('href', /\/resume\.pdf$/);
    await expect(page.locator('[data-real-link="pdf"]')).toHaveText('Open Résumé PDF');
    expect((await session(page)).casinoLosses).toBe(1);
  });

  test('the pointer always lands on the announced wedge', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('casino/?dest=repo&debug=wedges&seed=1234');
    for (let i = 0; i < 12; i++) {
      // Fresh attempts each time so spin 2's branches get exercised too.
      if (i % 3 === 0) await page.evaluate(() => sessionStorage.removeItem('uvcr:session'));
      const outcome = await spin(page, (i * 0.137) % 1);
      const readout = await page.locator('[data-debug-readout]').innerText();
      const m = /pointer on #(\d) \(([^)]+)\) · house chose #(\d) \(([^)]+)\)/.exec(readout);
      expect(m?.[1]).toBe(m?.[3]);
      expect(m?.[2]).toBe(outcome);
      await expect(page.locator('#announcer')).toHaveText(`Result: ${outcome}.`);
      if (outcome === 'RICKROLL') await expect(page.locator('#rickroll')).toBeHidden();
    }
    await done();
  });
});

test.describe('without JavaScript', () => {
  test('every destination is listed, without allocation', async ({ browser, request }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('casino/');
    await expect(page.locator('[data-casino]')).toBeHidden();
    const html = await (await request.get('casino/')).text();
    expect(html).toMatch(
      /<noscript>[\s\S]*Allocation requires JavaScript\. Every destination, without allocation:[\s\S]*data-direct="github"[\s\S]*<\/noscript>/,
    );
    await ctx.close();
  });

  test('with JavaScript the table is in the first paint (no layout shift)', async ({ page }) => {
    await page.goto('casino/', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute('data-js', '');
    await expect(page.locator('[data-casino]')).toBeVisible();
  });
});

test.describe('musical material', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
    await stubYouTube(page);
  });

  test('nothing loads from YouTube until the play control is pressed', async ({ page }) => {
    const yt: string[] = [];
    page.on('request', (r) => {
      if (/youtube/.test(r.url())) yt.push(r.url());
    });
    await page.goto('rick/');
    await page.waitForTimeout(300);
    expect(yt).toEqual([]);
    await page.getByRole('button', { name: 'Play the material on file' }).click();
    await expect(page.locator('#rickroll iframe')).toHaveCount(1);
    await page.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('#rickroll iframe')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Play the material on file' })).toBeFocused();
  });

  test('share pages carry sincere Open Graph copy and a stationary way in @smoke', async ({
    page,
  }) => {
    await page.goto('r/car-thing/');
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      'content',
      'Case File: The Car Thing Media Controller',
    );
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'A discontinued embedded Linux touch device, repurposed as a desk media controller.',
    );
    await expect(page.locator('meta[http-equiv="refresh"]')).toHaveCount(0);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Case File DDP-15/3: The Car Thing Media Controller',
    );
    await expect(page.getByRole('link', { name: 'Open the file without music' })).toHaveAttribute(
      'href',
      /\/projects\/#car-thing$/,
    );
  });

  test('Direct access closes the player and removes it', async ({ page }) => {
    await page.goto('r/xml-parser/');
    await page.getByRole('button', { name: 'Play the material and open the file' }).click();
    await expect(page.locator('#rickroll iframe')).toHaveCount(1);
    await page
      .locator('header')
      .getByRole('switch', { name: 'Direct access' })
      .dispatchEvent('click');
    await expect(page.locator('#rickroll')).toBeHidden();
    await expect(page.locator('#rickroll iframe')).toHaveCount(0);
  });
});
