import { expect, test, type Page } from '@playwright/test';
import { PNG } from '../png';
import { seedPrefs, watchErrors } from '../helpers';

/** Watch every script response and report whether three.js was among them. */
function watchThree(page: Page): () => boolean {
  let loaded = false;
  page.on('response', async (r) => {
    if (!r.url().endsWith('.js')) return;
    try {
      if ((await r.text()).includes('isWebGLRenderer')) loaded = true;
    } catch {
      /* navigation raced the body */
    }
  });
  return () => loaded;
}

test.describe('The Tungsten Cube Experience', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('renders real tungsten in WebGL, then rains and clears cubes', async ({ page }) => {
    test.setTimeout(60_000);
    const done = await watchErrors(page);
    await page.goto('cube/');
    const canvas = page.locator('[data-cube-stage] canvas');
    await expect(canvas).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-cube-fallback]')).toBeHidden();

    // The canvas holds a lit metal cube: plenty of distinct, non-background pixels.
    const png = PNG.decode(await canvas.screenshot());
    const shades = new Set<number>();
    for (let i = 0; i < png.data.length; i += 4 * 37)
      shades.add(((png.data[i] ?? 0) >> 3) * 1024 + ((png.data[i + 1] ?? 0) >> 3) * 32);
    expect(shades.size).toBeGreaterThan(25);

    const summon = page.locator('[data-cube-summon]');
    await expect(summon).toHaveText('Summon 1,000 more cubes (0 / 10,000)');
    await summon.click();
    await expect(page.locator('[data-cube-count]')).toHaveText('Cubes on the floor: 1,000.');
    await expect(summon).toHaveText('Summon 1,000 more cubes (1,000 / 10,000)');
    await page.getByRole('button', { name: 'Heft it' }).click();
    await expect(page.locator('#announcer')).toHaveText('Thud.');
    await page.getByRole('button', { name: 'Clear the floor' }).click();
    await expect(page.locator('[data-cube-count]')).toHaveText('Cubes on the floor: 0.');
    await expect(summon).toBeFocused();
    await done();
  });

  test('ten thousand cubes is where the floor draws the line', async ({ page }) => {
    test.setTimeout(90_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('cube/');
    await expect(page.locator('[data-cube-stage] canvas')).toBeVisible({ timeout: 20_000 });
    const summon = page.locator('[data-cube-summon]');
    for (let n = 0; n < 10; n++) await summon.click();
    await expect(summon).toHaveText('The floor has filed a complaint.');
    await expect(summon).toBeDisabled();
    await expect(page.locator('[data-cube-count]')).toHaveText('Cubes on the floor: 10,000.');
  });

  test('three.js only downloads on the cube pages', async ({ page }) => {
    const three = watchThree(page);
    for (const r of ['', 'about/', 'casino/', 'presentation/', 'tailor/']) {
      await page.goto(r);
      await page.waitForLoadState('networkidle');
    }
    expect(three()).toBe(false);
    await page.goto('cube/');
    await expect(page.locator('[data-cube-stage] canvas')).toBeVisible({ timeout: 20_000 });
    expect(three()).toBe(true);
  });

  test('the wishlist hero turns 3D only in view, and never with reduced motion', async ({
    page,
  }) => {
    const three = watchThree(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('wishlist/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-cube-hero] [data-cube-fallback]')).toBeVisible();
    expect(three()).toBe(false);

    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await page.reload();
    await expect(page.locator('[data-cube-hero] canvas')).toBeVisible({ timeout: 20_000 });
    await expect(page.locator('[data-cube-hero] [data-cube-fallback]')).toBeHidden();
    expect(three()).toBe(true);
  });

  test('Direct access puts the drawing back and hides the controls', async ({ page }) => {
    await page.goto('cube/');
    await expect(page.locator('[data-cube-stage] canvas')).toBeVisible({ timeout: 20_000 });
    const sw = page.locator('header').getByRole('switch', { name: 'Direct access' });
    await sw.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-cube-stage] canvas')).toBeHidden();
    await expect(page.locator('[data-cube-fallback]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Heft it' })).toBeHidden();
    await expect(page.getByRole('heading', { name: 'Specifications' })).toBeVisible();
  });

  test('without WebGL the drawing stays and says why', async ({ page }) => {
    await page.addInitScript(() => {
      const orig = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        id: string,
        ...rest: unknown[]
      ) {
        if (/webgl/.test(id)) return null;
        return (orig as (...a: unknown[]) => unknown).call(this, id, ...rest);
      } as typeof orig;
    });
    await page.goto('cube/');
    await expect(page.locator('[data-cube-status]')).toContainText(
      'Your browser declined to render tungsten.',
    );
    await expect(page.locator('[data-cube-fallback]')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Heft it' })).toBeDisabled();
  });
});
