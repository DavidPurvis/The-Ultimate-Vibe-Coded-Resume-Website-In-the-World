import { expect, test } from '@playwright/test';
import { HTML_ROUTES, seedPrefs } from './helpers';

for (const width of [320, 390]) {
  test(`no horizontal scrolling at ${width}px on any page`, async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
    await page.setViewportSize({ width, height: 800 });
    const wide: string[] = [];
    for (const r of HTML_ROUTES) {
      await page.goto(r);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 0) wide.push(`${r || '/'}: +${over}px`);
    }
    expect(wide).toEqual([]);
  });
}

test('dialogs fit a small phone with Close visible @mobile', async ({ page }) => {
  await seedPrefs(page, {}, { identityPrompted: true });
  await page.setViewportSize({ width: 320, height: 640 });
  await page.route('https://www.youtube-nocookie.com/**', (r) =>
    r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
  );
  await page.goto('rick/');
  await page.getByRole('button', { name: 'Begin due diligence' }).click();
  const d = page.locator('#rickroll');
  await expect(d).toBeVisible();
  const box = await d.boundingBox();
  expect(box && box.width <= 320).toBe(true);
  await expect(d.getByRole('button', { name: 'Close', exact: true })).toBeInViewport();
});

test('no layout shift on load for pages with JS-only instruments', async ({ page }) => {
  await seedPrefs(page, {}, { identityPrompted: true });
  await page.addInitScript(() => {
    (window as unknown as { __cls: number }).__cls = 0;
    new PerformanceObserver((list) => {
      for (const e of list.getEntries() as (PerformanceEntry & {
        value: number;
        hadRecentInput: boolean;
      })[])
        if (!e.hadRecentInput) (window as unknown as { __cls: number }).__cls += e.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const r of ['casino/', 'contact/', 'legal/', '']) {
    await page.goto(r);
    await page.waitForTimeout(800);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls, r || '/').toBeLessThan(0.1);
  }
});
