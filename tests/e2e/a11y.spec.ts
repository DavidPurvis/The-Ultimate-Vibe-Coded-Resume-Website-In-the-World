import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { HTML_ROUTES, seedCase } from './helpers';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];

const OPEN = { t: 'RESUME_REQUESTED', via: 'cta' };
const TO_FINDINGS = [
  OPEN,
  { t: 'SCOPE_STATED', lane: 'plt' },
  { t: 'RESUME_REQUESTED', via: 'full-document' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'RELEASE_ATTEMPTED' },
  { t: 'STEP_COMPLETED', step: 'ceremony' },
];
const TO_ACK = [...TO_FINDINGS, { t: 'STEP_COMPLETED', step: 'findings' }];
/** Each state of the case on `/`, restored from a stored case, and what shows it is ready. */
const CASE_STATES: [string, unknown[], string][] = [
  ['arrival', [], 'View résumé'],
  ['scope', [OPEN], 'Submit scope'],
  ['preview', [OPEN, { t: 'SCOPE_STATED', lane: 'plt' }], 'Request full document'],
  ['release', TO_FINDINGS.slice(0, 3), 'Release document'],
  ['release, resisted', TO_FINDINGS.slice(0, 5), 'Release document (reassigned)'],
  ['ceremony', TO_FINDINGS.slice(0, 6), 'Continue'],
  ['findings', TO_FINDINGS, 'Proceed to adjudication'],
  ['acknowledgment', TO_ACK, 'Acknowledge'],
  ['appeal', [...TO_ACK, { t: 'APPEAL_REQUESTED' }], 'Continue'],
  ['disposition', [...TO_ACK, { t: 'ACKNOWLEDGED' }, { t: 'ACKNOWLEDGED' }], 'Open résumé'],
];

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

  for (const scheme of ['light', 'dark'] as const) {
    test(`case on /, every step (${scheme}): no serious or critical axe violations`, async ({
      context,
    }) => {
      const found: string[] = [];
      for (const [name, events, ready] of CASE_STATES) {
        // A new tab per state: sessionStorage (the case) is per tab.
        const page = await context.newPage();
        await page.emulateMedia({ colorScheme: scheme });
        await seedCase(page, { events });
        await page.goto('./');
        const role = name === 'arrival' || name === 'disposition' ? 'link' : 'button';
        await expect(page.getByRole(role, { name: ready }).first()).toBeVisible();
        for (const v of await seriousViolations(page)) found.push(`${name} → ${v}`);
        await page.close();
      }
      expect(found).toEqual([]);
    });
  }

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
