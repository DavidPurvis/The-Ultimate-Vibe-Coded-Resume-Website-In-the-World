import { expect, test } from '@playwright/test';
import { HTML_ROUTES, seedCase, seedPrefs } from './helpers';

const OPEN = { t: 'RESUME_REQUESTED', via: 'cta' };
const AT_RELEASE = [
  OPEN,
  { t: 'SCOPE_STATED', lane: 'plt' },
  { t: 'RESUME_REQUESTED', via: 'full-document' },
];
const AT_CEREMONY = [...AT_RELEASE, ...Array(3).fill({ t: 'RELEASE_ATTEMPTED' })];
const AT_FINDINGS = [...AT_CEREMONY, { t: 'STEP_COMPLETED', step: 'ceremony' }];
/** Every case step on `/`, restored from a stored case, with the control that shows it is ready. */
const CASE_STEPS: [string, unknown[], string][] = [
  ['scope', [OPEN], 'Submit scope'],
  ['preview', AT_RELEASE.slice(0, 2), 'Request full document'],
  ['release', [...AT_RELEASE, { t: 'RELEASE_ATTEMPTED' }], 'Release document'],
  ['ceremony', AT_CEREMONY, 'Continue'],
  ['findings', AT_FINDINGS, 'Proceed to adjudication'],
  ['acknowledgment', [...AT_FINDINGS, { t: 'STEP_COMPLETED', step: 'findings' }], 'Acknowledge'],
];

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

for (const width of [320, 390]) {
  test(`no horizontal scrolling at ${width}px at any step of the case`, async ({ context }) => {
    const wide: string[] = [];
    for (const [name, events, ready] of CASE_STEPS) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 800 });
      await seedCase(page, { events });
      await page.goto('./');
      await expect(page.getByRole('button', { name: ready })).toBeVisible();
      const over = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
      if (over > 0) wide.push(`${name}: +${over}px`);
      await page.close();
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
