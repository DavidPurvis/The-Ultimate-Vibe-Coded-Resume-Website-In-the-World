import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, watchErrors } from '../helpers';

const YT = 'https://www.youtube-nocookie.com/**';

/** The overlay's switch lives in Recreation, on the directory. */
const overlaySwitch = (page: Page) =>
  page.locator('#recreation').getByRole('switch', { name: 'Attention-span assistance' });
async function switchOn(page: Page): Promise<void> {
  await overlaySwitch(page).click();
}
const directAccess = (page: Page) =>
  page.locator('header').getByRole('switch', { name: 'Direct access' });

test.describe('Attention-Span Mode', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('until David supplies gameplay, players are placeholders and nothing loads from YouTube @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    const offOrigin: string[] = [];
    page.on('request', (r) => {
      if (!r.url().startsWith('http://127.0.0.1')) offOrigin.push(r.url());
    });
    await page.goto('./');
    await switchOn(page);
    const players = page.locator('[data-subway-player]');
    await expect(players).toHaveCount(1);
    await expect(players.first()).toContainText('Gameplay pending.');
    await expect(page.locator('iframe[src*="youtube"]')).toHaveCount(0);
    expect(offOrigin).toEqual([]);
    await done();
  });

  test.describe('with gameplay @hooks', () => {
    test.beforeEach(async ({ page }) => {
      await page.route(YT, (r) =>
        r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
      );
    });

    const withVideo = async (page: Page, path: string) => {
      await page.goto(path);
      await page.evaluate(() =>
        (
          window as unknown as { __uvcr: { subwayVideos(...ids: string[]): void } }
        ).__uvcr.subwayVideos('test-gameplay'),
      );
    };

    test('nothing loads before the switch; ten summons is reasonable, twelve is the limit', async ({
      page,
    }) => {
      const yt: string[] = [];
      page.on('request', (r) => {
        if (r.url().includes('youtube')) yt.push(r.url());
      });
      await withVideo(page, './');
      await page.waitForLoadState('networkidle');
      expect(yt).toEqual([]);

      await switchOn(page);
      const frames = page.locator('[data-subway-player] iframe');
      await expect(frames).toHaveCount(1);
      await expect(frames.first()).toHaveAttribute(
        'src',
        /^https:\/\/www\.youtube-nocookie\.com\/embed\/test-gameplay\?autoplay=0&mute=1/,
      );
      await expect(frames.first()).toHaveAttribute('title', 'Subway Surfers gameplay (muted)');

      const dock = page.getByRole('group', { name: 'Attention-Span Mode' });
      for (let n = 1; n < 10; n++)
        await dock.getByRole('button', { name: `Summon gameplay (${n}/12)` }).click();
      await expect(frames).toHaveCount(10);
      await expect(dock).toContainText('Reasonable amount reached.');

      await dock.getByRole('button', { name: 'Summon gameplay (10/12)' }).click();
      await dock.getByRole('button', { name: 'Summon gameplay (11/12)' }).click();
      await expect(frames).toHaveCount(12);
      const refuse = dock.getByRole('button', { name: 'Summon gameplay (12/12)' });
      await expect(refuse).toBeDisabled();
      await expect(dock).toContainText('Unreasonable amounts require Director approval.');
      expect(yt.every((u) => u.startsWith('https://www.youtube-nocookie.com/embed/'))).toBe(true);
    });

    test('players persist across pages, and Direct access takes them all down', async ({
      page,
    }) => {
      await withVideo(page, './');
      await switchOn(page);
      const dock = page.getByRole('group', { name: 'Attention-Span Mode' });
      await dock.getByRole('button', { name: 'Summon gameplay (1/12)' }).click();
      await dock.getByRole('button', { name: 'Summon gameplay (2/12)' }).click();
      await expect(page.locator('[data-subway-player]')).toHaveCount(3);

      await withVideo(page, 'about/');
      await expect(page.locator('[data-subway-player]')).toHaveCount(3);

      // By keyboard: a summoned player may be floating over the footer switch.
      const recruiter = directAccess(page);
      await recruiter.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-subway-player]')).toHaveCount(0);
      await expect(page.locator('iframe')).toHaveCount(0);
      await recruiter.focus();
      await page.keyboard.press('Enter');
      await expect(page.locator('[data-subway-player]')).toHaveCount(3);
    });

    test('players can be moved by keyboard, dismissed one at a time, or all at once', async ({
      page,
    }) => {
      await withVideo(page, './');
      await switchOn(page);
      const dock = page.getByRole('group', { name: 'Attention-Span Mode' });
      await dock.getByRole('button', { name: 'Summon gameplay (1/12)' }).click();

      const handle = page.getByRole('button', { name: /^Player 1\. Drag it/ });
      const player = page.locator('[data-subway-player="1"]');
      const before = (await player.boundingBox()) ?? { x: 0, y: 0 };
      await handle.focus();
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('Shift+ArrowDown');
      // Reduced motion still leaves a 0.01ms transition, so poll for the settled position.
      await expect
        .poll(async () => {
          const b = await player.boundingBox();
          return [Math.round((b?.x ?? 0) - before.x), Math.round((b?.y ?? 0) - before.y)];
        })
        .toEqual([16, 64]);

      await page.getByRole('button', { name: 'Dismiss player 2' }).click();
      await expect(page.locator('[data-subway-player]')).toHaveCount(1);
      await dock.getByRole('button', { name: 'Dismiss all' }).click();
      await expect(page.locator('[data-subway-player]')).toHaveCount(0);
      await expect(dock.getByRole('button', { name: 'Summon gameplay (0/12)' })).toBeFocused();

      const s = await page.evaluate(() =>
        JSON.parse(sessionStorage.getItem('uvcr:session') ?? '{}'),
      );
      expect(s.subway).toEqual({ on: true, count: 0 });
    });

    test('switching the mode off removes everything', async ({ page }) => {
      await withVideo(page, './');
      await switchOn(page);
      await expect(page.locator('[data-subway-player]')).toHaveCount(1);
      const sw = overlaySwitch(page);
      await expect(sw).toHaveAttribute('aria-checked', 'true');
      await sw.click();
      await expect(sw).toHaveAttribute('aria-checked', 'false');
      await expect(page.locator('[data-subway-player], .subway-dock')).toHaveCount(0);
      await page.goto('about/');
      await expect(page.locator('[data-subway-player]')).toHaveCount(0);
    });

    test('axe stays clean with players out', async ({ page }) => {
      await withVideo(page, './');
      await switchOn(page);
      await expect(page.locator('[data-subway-player]')).toHaveCount(1);
      const { violations } = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .exclude('iframe')
        .analyze();
      expect(
        violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => v.id),
      ).toEqual([]);
    });
  });

  test('the tribute stays sincere', async ({ page }) => {
    await seedPrefs(page, {}, { subway: { on: true, count: 2 } });
    await page.goto('tribute/');
    await expect(page.locator('[data-subway-player], .subway-dock')).toHaveCount(0);
  });
});
