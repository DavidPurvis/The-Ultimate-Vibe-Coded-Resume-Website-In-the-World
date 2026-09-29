import { expect, test } from '@playwright/test';
import { HTML_ROUTES } from './helpers';

for (const width of [320, 390]) {
  test(`no horizontal scrolling at ${width}px on any page`, async ({ page }) => {
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

test('no layout shift on load for pages with scripts', async ({ page }) => {
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
  for (const r of ['', 'privacy/', 'doom/', 'resume/']) {
    await page.goto(r);
    await page.waitForTimeout(800);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls, r || '/').toBeLessThan(0.1);
  }
});
