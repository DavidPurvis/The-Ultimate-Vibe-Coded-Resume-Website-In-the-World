import { expect, test, type Page } from '@playwright/test';
import { PNG } from './png';
import { watchErrors } from './helpers';

/** Share of pixels in the DOOM screen that aren't (nearly) black. */
async function litShare(page: Page, sel: string): Promise<number> {
  const png = PNG.decode(await page.locator(sel).screenshot());
  let lit = 0;
  let n = 0;
  for (let i = 0; i < png.data.length; i += 4 * 11) {
    n++;
    if ((png.data[i] ?? 0) + (png.data[i + 1] ?? 0) + (png.data[i + 2] ?? 0) > 60) lit++;
  }
  return lit / n;
}

test.describe('DOOM', () => {
  test('runs embedded in the page, from this site, only after Play', async ({ page }) => {
    test.setTimeout(90_000);
    const done = await watchErrors(page);
    const requests: string[] = [];
    page.on('request', (r) => requests.push(r.url()));
    await page.goto('doom/');
    await page.waitForLoadState('networkidle');
    expect(requests.filter((u) => u.includes('/doom-engine/'))).toEqual([]);

    await page.getByRole('button', { name: '▶ Play DOOM' }).click();
    const frame = page.locator('[data-doom-page] iframe');
    await expect(frame).toHaveAttribute('title', 'DOOM, shareware episode 1');
    await expect(page.locator('[data-doom-page] [data-doom-status]')).toContainText(
      'Knee-Deep in the Dead',
      { timeout: 60_000 },
    );
    // The engine draws: the screen fills with the level (or the attract demo), not black.
    await expect
      .poll(() => litShare(page, '[data-doom-page] [data-doom-screen]'), { timeout: 30_000 })
      .toBeGreaterThan(0.3);

    const engine = requests.filter((u) => u.includes('/doom-engine/'));
    for (const f of [
      'play.html',
      'boot.js',
      'websockets-doom.js',
      'websockets-doom.wasm',
      'doom1.wad',
    ])
      expect(
        engine.some((u) => u.includes(f)),
        f,
      ).toBe(true);
    expect(requests.filter((u) => !u.startsWith('http://127.0.0.1'))).toEqual([]);
    await done();
  });

  test('Shift+Esc gives the keyboard back; Stop ends the game', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('doom/');
    await page.getByRole('button', { name: '▶ Play DOOM' }).click();
    const status = page.locator('[data-doom-page] [data-doom-status]');
    await expect(status).toContainText('Knee-Deep in the Dead', { timeout: 60_000 });

    // Focus is inside the game's frame; Tab would be DOOM's automap, so Shift+Esc is the way out.
    await page.frameLocator('[data-doom-page] iframe').locator('canvas').click();
    await page.keyboard.press('Shift+Escape');
    const stopBtn = page.getByRole('button', { name: '■ Stop' });
    await expect(stopBtn).toBeFocused();
    await expect(status).toContainText('Keyboard returned to the page.');

    await stopBtn.click();
    await expect(page.locator('[data-doom-page] iframe')).toHaveCount(0);
    await expect(page.locator('[data-doom-page] [data-doom-poster]')).toBeVisible();
    await expect(page.getByRole('button', { name: '▶ Play DOOM' })).toBeFocused();
    await expect(status).toHaveText('Stopped. The demons will wait.');
  });

  test('leaving the page ends the game; the sound switch lives in memory', async ({ page }) => {
    await page.goto('doom/');
    const sw = page.getByRole('switch', { name: 'Sound effects' });
    await expect(sw).toHaveAttribute('aria-checked', 'false');
    await sw.click();
    await expect(sw).toHaveAttribute('aria-checked', 'true');
    await page.getByRole('button', { name: '▶ Play DOOM' }).click();
    await expect(page.locator('[data-doom-page] iframe')).toHaveAttribute('src', /sound=1$/);
    // Even a page kept for back/forward must not keep the game running.
    await page.evaluate(() =>
      window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true })),
    );
    await expect(page.locator('iframe')).toHaveCount(0);
    await expect(page.locator('[data-doom-page] [data-doom-poster]')).toBeVisible();
    const stored = await page.evaluate(() => [
      ...Object.keys(localStorage),
      ...Object.keys(sessionStorage),
    ]);
    expect(stored.filter((k) => k.startsWith('uvcr:'))).toEqual([]);
  });

  test('loading never pulls focus from wherever the visitor went next', async ({ page }) => {
    test.setTimeout(90_000);
    await page.goto('doom/');
    await page.getByRole('button', { name: '▶ Play DOOM' }).click();
    const elsewhere = page.getByRole('switch', { name: 'Sound effects' });
    await elsewhere.focus();
    await expect(page.locator('[data-doom-page] [data-doom-status]')).toContainText(
      'Knee-Deep in the Dead',
      { timeout: 60_000 },
    );
    await page.waitForTimeout(500);
    await expect(elsewhere).toBeFocused();
  });

  test('the engine frame is the only document allowed to compile WebAssembly', async ({
    request,
  }) => {
    const engine = await (await request.get('doom-engine/play.html')).text();
    expect(engine).toContain("'wasm-unsafe-eval'");
    for (const r of ['doom/', '', 'projects/', 'resume/']) {
      const html = await (await request.get(r)).text();
      expect(html, r).not.toContain('wasm-unsafe-eval');
    }
    const wasm = await request.get('doom-engine/websockets-doom.wasm');
    expect(wasm.headers()['content-type']).toContain('application/wasm');
  });
});
