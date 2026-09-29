import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { HTML_ROUTES } from './helpers';

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
  // One test per page: each gets its own timeout (axe is slow on WebKit) and names its page.
  for (const r of HTML_ROUTES) {
    test(`${r || '/'}: no serious or critical axe violations @smoke`, async ({ page }) => {
      await page.goto(r);
      expect(await seriousViolations(page)).toEqual([]);
    });
  }

  test('every page in dark mode with reduced motion', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
    const found: string[] = [];
    for (const r of HTML_ROUTES) {
      await page.goto(r);
      for (const v of await seriousViolations(page)) found.push(`${r || '/'} → ${v}`);
    }
    expect(found).toEqual([]);
  });

  test('interactive controls in main are at least 44×44 CSS px', async ({ page }) => {
    // Measure layout, not a control caught mid-transition.
    await page.emulateMedia({ reducedMotion: 'reduce' });
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
