import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from './helpers';

const GITHUB = 'https://github.com/DavidPurvis';

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

test.describe('link roulette', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
    await stubYouTube(page);
  });

  test('spin 1 rickrolls, spin 2 follows the odds, spin 3 always pays @smoke', async ({ page }) => {
    const done = await watchErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('casino/?dest=github');
    await expect(page.getByRole('button', { name: 'GitHub' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.locator('[data-attempting]')).toHaveText(
      'You are attempting to visit: GitHub (github.com/DavidPurvis).',
    );

    expect(await spin(page)).toBe('RICKROLL');
    await page.getByRole('button', { name: 'Proceed to due diligence' }).click();
    const dialog = page.locator('#rickroll');
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('iframe')).toHaveAttribute(
      'src',
      /youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/,
    );
    await page.keyboard.press('Escape');
    await expect(dialog.locator('iframe')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Proceed to due diligence' })).toBeFocused();
    await expect(
      page.getByText('Your persistence has been added to the hiring file.'),
    ).toBeVisible();

    expect(await spin(page, 0.9)).toBe('DOUBLE OR NOTHING');
    expect(await spin(page)).toBe('HYPERLINK');
    const link = page.locator('[data-real-link="github"]');
    await expect(link).toHaveAttribute('href', GITHUB);
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    expect(
      await page.evaluate(() => JSON.parse(sessionStorage.getItem('uvcr:session')!).casino.github),
    ).toBe(3);
    await done();
  });

  test('RIP: pay respects with F to revive the link', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
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
  });

  test('HYPERLINK can come early on spin 2', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('casino/?dest=pdf');
    await spin(page);
    expect(await spin(page, 0.82)).toBe('HYPERLINK');
    await expect(page.locator('[data-real-link="pdf"]')).toHaveAttribute('href', /\/resume\.pdf$/);
  });

  test('a double click records one attempt, and cards lock while spinning', async ({ page }) => {
    await page.goto('casino/?dest=email');
    await page.locator('[data-spin]').dblclick();
    await expect(page.getByRole('button', { name: /^Email/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    await expect(page.locator('[data-casino-result]')).toBeVisible({ timeout: 8000 });
    expect(
      await page.evaluate(() => JSON.parse(sessionStorage.getItem('uvcr:session')!).casino.email),
    ).toBe(1);
    await expect(page.getByRole('button', { name: /^Email/ })).toHaveAttribute(
      'aria-disabled',
      'false',
    );
  });

  test('the pointer always lands on the announced wedge', async ({ page }) => {
    const done = await watchErrors(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
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

  test('reduced motion lands in well under a second', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('casino/?dest=github');
    const t0 = Date.now();
    await page.locator('[data-spin]').click();
    await expect(page.locator('[data-casino-result]')).toBeVisible();
    expect(Date.now() - t0).toBeLessThan(1500);
  });

  test('without a destination the house asks you to pick one', async ({ page }) => {
    await page.goto('casino/');
    await expect(page.locator('[data-spin]')).toHaveAttribute('aria-disabled', 'true');
    await page.locator('[data-spin]').click({ force: true }); // aria-disabled, but people still click
    await expect(page.locator('[data-casino-status]')).toContainText(
      'Please select the information',
    );
    await expect(page.locator('[data-casino-result]')).toBeHidden();
  });

  test('Recruiter Mode mid-spin closes the house and lists the real links', async ({ page }) => {
    await page.goto('casino/?dest=github');
    await page.locator('[data-spin]').click();
    await page.getByRole('switch', { name: 'Recruiter Mode' }).click();
    await expect(page.locator('[data-casino]')).toBeHidden();
    await expect(page.getByText('The house has closed for Recruiter Mode.')).toBeVisible();
    await expect(page.locator('.recruiter-only [data-direct="github"]')).toHaveAttribute(
      'href',
      GITHUB,
    );
    await page.waitForTimeout(500);
    await expect(page.locator('[data-casino-result]')).toBeHidden();
  });

  test('responsible gambling goes straight to the résumé', async ({ page }) => {
    await page.goto('casino/');
    await page.getByRole('link', { name: '1-800-JUST-READ-THE-RESUME' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });
});

test.describe('without JavaScript', () => {
  test('the house concedes: real links, no wheel', async ({ browser, request }) => {
    const ctx = await browser.newContext({ javaScriptEnabled: false });
    const page = await ctx.newPage();
    await page.goto('casino/');
    await expect(page.locator('[data-casino]')).toBeHidden();
    const html = await (await request.get('casino/')).text();
    expect(html).toMatch(
      /<noscript>[\s\S]*The wheel requires JavaScript\. The house concedes:[\s\S]*data-direct="github"[\s\S]*<\/noscript>/,
    );
    await ctx.close();
  });

  test('with JavaScript the table is in the first paint (no layout shift)', async ({ page }) => {
    await page.goto('casino/', { waitUntil: 'commit' });
    await expect(page.locator('html')).toHaveAttribute('data-js', '');
    await expect(page.locator('[data-casino]')).toBeVisible();
  });
});

test.describe('rickroll pages and decoys', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
    await stubYouTube(page);
  });

  test('nothing loads from YouTube until the button is pressed', async ({ page }) => {
    const yt: string[] = [];
    page.on('request', (r) => {
      if (/youtube/.test(r.url())) yt.push(r.url());
    });
    await page.goto('rick/');
    await page.waitForTimeout(300);
    expect(yt).toEqual([]);
    await page.getByRole('button', { name: 'Begin due diligence' }).click();
    await expect(page.locator('#rickroll iframe')).toHaveCount(1);
    await expect(
      page.getByRole('link', { name: 'Continue to where you were going →' }),
    ).toHaveAttribute('href', /\/projects\/$/);
  });

  test('decoys carry sincere Open Graph copy and a stationary skip link @smoke', async ({
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
      'Case File DRV-15/3: The Car Thing Media Controller',
    );
    await expect(
      page.getByRole('link', { name: 'Skip to the actual case file →' }),
    ).toHaveAttribute('href', /\/projects\/#car-thing$/);
  });

  test('switching to Recruiter Mode closes an open rickroll and removes the player', async ({
    page,
  }) => {
    await page.goto('r/xml-parser/');
    await page.getByRole('button', { name: 'Begin due diligence' }).click();
    await expect(page.locator('#rickroll iframe')).toHaveCount(1);
    await page.getByRole('switch', { name: 'Recruiter Mode' }).dispatchEvent('click');
    await expect(page.locator('#rickroll')).toBeHidden();
    await expect(page.locator('#rickroll iframe')).toHaveCount(0);
  });
});
