/** Access is always one activation away, and the Department never intercepts a modified click. */
import { expect, test } from '@playwright/test';
import { seedCase } from './helpers';

const OPEN = { t: 'RESUME_REQUESTED', via: 'cta' };
const AT_RELEASE = [
  OPEN,
  { t: 'SCOPE_STATED', lane: 'be' },
  { t: 'RESUME_REQUESTED', via: 'full-document' },
];
const AT_CEREMONY = [...AT_RELEASE, ...Array(3).fill({ t: 'RELEASE_ATTEMPTED' })];
const AT_FINDINGS = [...AT_CEREMONY, { t: 'STEP_SKIPPED', step: 'ceremony' }];
const AT_ACK = [...AT_FINDINGS, { t: 'STEP_COMPLETED', step: 'findings' }];
/** Each open step, restored from a stored case, and a control that shows it is ready. */
const STEPS: [string, unknown[], string][] = [
  ['scope', [OPEN], 'Submit scope'],
  ['preview', AT_RELEASE.slice(0, 2), 'Request full document'],
  ['release', AT_RELEASE, 'Release document'],
  ['ceremony', AT_CEREMONY, 'Skip ceremony'],
  ['findings', AT_FINDINGS, 'Proceed to adjudication'],
  ['acknowledgment', AT_ACK, 'Acknowledge'],
];

test.describe('access', () => {
  test('the skip link is the first Tab stop and goes straight to the résumé @smoke', async ({
    page,
  }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to the résumé' });
    await expect(skip).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/resume\/$/);
  });

  test('every step offers the direct link and the expedite control', async ({ page }) => {
    for (const [name, events, ready] of STEPS) {
      const p = await page.context().newPage();
      await seedCase(p, { events });
      await p.goto('./');
      await expect(p.getByRole('button', { name: ready }), name).toBeVisible();
      await expect(p.getByRole('link', { name: 'Open the résumé directly' })).toBeVisible();
      await expect(p.getByRole('button', { name: 'Request expedited processing' })).toBeVisible();
      await p.close();
    }
  });

  test('a modified click on the CTA opens the résumé and opens no case', async ({
    page,
    context,
  }) => {
    await seedCase(page);
    await page.goto('./');
    const [popup] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: 'View résumé' }).click({ modifiers: ['ControlOrMeta'] }),
    ]);
    // A new tab starts at about:blank; wait for the navigation itself, not just a load state.
    await expect(popup).toHaveURL(/\/resume\/$/);
    await expect(page.locator('#case')).toBeHidden();
    const stored = await page.evaluate(() => sessionStorage.getItem('uvcr:case'));
    expect(JSON.parse(stored ?? '{"events":[]}').events).toEqual([]);
  });

  test('controls in the case are at least 44×44 at every step', async ({ page }) => {
    const small: string[] = [];
    for (const [name, events, ready] of STEPS) {
      const p = await page.context().newPage();
      await p.emulateMedia({ reducedMotion: 'reduce' });
      await seedCase(p, { events });
      await p.goto('./');
      await expect(p.getByRole('button', { name: ready })).toBeVisible();
      const hits = await p.$$eval('#case button, #case a, #case label', (els) =>
        els
          .map((e) => ({ t: e.textContent?.trim() ?? '', r: e.getBoundingClientRect() }))
          .filter((x) => x.r.width > 0 && (x.r.width < 44 || x.r.height < 44))
          .map((x) => `${x.t} ${x.r.width}×${x.r.height}`),
      );
      small.push(...hits.map((h) => `${name}: ${h}`));
      await p.close();
    }
    expect(small).toEqual([]);
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('J9 the obstruction service fails open @smoke', async ({ page, request }) => {
    // Chromium does not render <noscript> when scripting is disabled through automation, so the
    // notice is checked in the static HTML; the link is checked in a real script-free page.
    const html = await (await request.get('./')).text();
    expect(html).toMatch(
      /<noscript>[^]*Automated obstruction service unavailable\. Your résumé access request has therefore been approved by default\.[^]*<\/noscript>/,
    );
    await page.goto('./');
    await expect(page.locator('#case')).toBeHidden();
    await page.getByRole('link', { name: 'View résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await expect(page.locator('main .resume')).toContainText('Magna Cum Laude');
  });
});
