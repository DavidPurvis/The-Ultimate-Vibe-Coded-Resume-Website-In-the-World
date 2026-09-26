import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { HTML_ROUTES, seedPrefs } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

async function seriousViolations(page: Page, include?: string): Promise<string[]> {
  let b = new AxeBuilder({ page }).withTags(TAGS);
  if (include) b = b.include(include);
  const { violations } = await b.analyze();
  return violations
    .filter((v) => v.impact === 'serious' || v.impact === 'critical')
    .map(
      (v) =>
        `${v.id} (${v.impact}): ${v.nodes
          .map((n) => n.target.join(' '))
          .slice(0, 4)
          .join(' | ')}`,
    );
}

test.describe('accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page, {}, { identityPrompted: true });
    await page.route('https://www.youtube-nocookie.com/**', (r) =>
      r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>stub</title>' }),
    );
  });

  // One test per page: each gets its own timeout (axe is slow on WebKit) and names its page.
  for (const r of HTML_ROUTES) {
    test(`${r || '/'}: no serious or critical axe violations @smoke`, async ({ page }) => {
      await page.goto(r);
      expect(await seriousViolations(page)).toEqual([]);
    });
  }

  test('dark theme and reduced motion', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const found: string[] = [];
    for (const r of ['', 'verify/', 'casino/', 'legal/', 'resume/', 'skills/']) {
      await page.goto(r);
      for (const v of await seriousViolations(page)) found.push(`${r || '/'} → ${v}`);
    }
    expect(found).toEqual([]);
  });

  test('open dialogs: identity, vendors, rickroll, hire', async ({ page }) => {
    const found: string[] = [];
    await page.goto('./');
    await page.getByRole('button', { name: 'Begin identity verification' }).click();
    await expect(page.locator('#identity')).toBeVisible();
    found.push(...(await seriousViolations(page, '#identity')));
    await page.keyboard.press('Escape');

    await page.goto('rick/');
    await page.getByRole('button', { name: 'Begin due diligence' }).click();
    await expect(page.locator('#rickroll')).toBeVisible();
    found.push(...(await seriousViolations(page, '#rickroll')));

    await page.goto('resume/');
    await page.getByRole('button', { name: 'Hire David' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    found.push(...(await seriousViolations(page, 'dialog[open]')));
    expect(found).toEqual([]);
  });

  test('first visit: cookie banner and the 3,000-partner dialog', async ({ page, context }) => {
    await context.clearCookies();
    const fresh = await context.newPage();
    await fresh.goto('./');
    await expect(fresh.locator('#cookie-consent-overlay')).toBeVisible();
    const found = await seriousViolations(fresh, '#cookie-consent-overlay');
    await fresh.getByRole('button', { name: 'Manage Detailed Settings' }).click();
    await expect(fresh.locator('#vendors')).toBeVisible();
    found.push(...(await seriousViolations(fresh, '#vendors')));
    expect(found).toEqual([]);
    void page;
  });

  test('interactive controls in main are at least 44×44 CSS px', async ({ page }) => {
    const small: string[] = [];
    for (const r of HTML_ROUTES) {
      await page.goto(r);
      const hits = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>(
            'main button, main .btn, main [role="switch"], main summary',
          ),
        ]
          .filter((el) => el.offsetParent !== null)
          .map((el) => ({ el, r: el.getBoundingClientRect() }))
          .filter(({ r }) => r.width > 0 && (r.width < 44 || r.height < 44))
          .map(
            ({ el, r }) =>
              `${el.textContent?.trim().slice(0, 30)} ${Math.round(r.width)}×${Math.round(r.height)}`,
          ),
      );
      for (const h of hits) small.push(`${r || '/'}: ${h}`);
    }
    expect(small).toEqual([]);
  });
});
