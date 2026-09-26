/** Access is always one activation away, and the Department never intercepts a modified click. */
import { expect, test } from '@playwright/test';
import { seedCase } from './helpers';

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
    const prefixes = [
      [{ t: 'RESUME_REQUESTED', via: 'cta' }],
      [
        { t: 'RESUME_REQUESTED', via: 'cta' },
        { t: 'SCOPE_STATED', lane: 'be' },
      ],
    ];
    for (const events of prefixes) {
      const p = await page.context().newPage();
      await seedCase(p, { events });
      await p.goto('./');
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
    await popup.waitForLoadState();
    expect(popup.url()).toMatch(/\/resume\/$/);
    await expect(page.locator('#case')).toBeHidden();
    const stored = await page.evaluate(() => sessionStorage.getItem('uvcr:case'));
    expect(JSON.parse(stored ?? '{"events":[]}').events).toEqual([]);
  });

  test('controls in the case are at least 44×44', async ({ page }) => {
    await seedCase(page);
    await page.goto('./');
    await page.getByRole('link', { name: 'View résumé' }).click();
    await expect(page.getByRole('button', { name: 'Submit scope' })).toBeVisible();
    const small = await page.$$eval('#case button, #case a, #case label', (els) =>
      els
        .map((e) => ({ t: e.textContent?.trim() ?? '', r: e.getBoundingClientRect() }))
        .filter((x) => x.r.width > 0 && (x.r.width < 44 || x.r.height < 44))
        .map((x) => `${x.t} ${x.r.width}×${x.r.height}`),
    );
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
