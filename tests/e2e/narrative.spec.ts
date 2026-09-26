/**
 * The canonical journeys through the Access Request (plan §R.4). Each ends on a clean résumé.
 * Deterministic: every journey starts from a seeded case, so the case number is known.
 */
import { expect, test, type Page } from '@playwright/test';
import { caseNumber } from '../../src/domain/assessment';
import { seedCase, watchErrors } from './helpers';

const SEED = 4242;
const CASE_NO = caseNumber(SEED);
const heading = (page: Page) => page.locator('#case-heading');
const OPEN = { t: 'RESUME_REQUESTED', via: 'cta' };
const SCOPE_PLT = { t: 'SCOPE_STATED', lane: 'plt' };

async function toPreview(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'View résumé' }).click();
  await expect(heading(page)).toHaveText('Scope clarification');
  await page.getByRole('radio', { name: 'Platform / SRE' }).check();
  await page.getByRole('button', { name: 'Submit scope' }).click();
  await expect(heading(page)).toHaveText('Approved in principle');
}

async function fromPreviewToDisposition(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Request full document' }).click();
  await expect(heading(page)).toHaveText('Preliminary determination');
  await page.getByRole('button', { name: 'Proceed to adjudication' }).click();
  await expect(heading(page)).toHaveText('Conditional approval');
  await page.getByRole('button', { name: 'Acknowledge' }).click();
  await expect(heading(page)).toHaveText('Confirm acknowledgment');
  await page.getByRole('button', { name: 'Confirm' }).click();
  await expect(heading(page)).toHaveText('Case closed');
}

test.describe('the Access Request', () => {
  test.beforeEach(async ({ page }) => {
    await seedCase(page, { seed: SEED });
  });

  test('J1 default: request, review, adjudication, then an ordinary résumé @smoke', async ({
    page,
  }) => {
    const done = await watchErrors(page);
    await page.goto('./');
    await expect(page.locator('#case')).toBeHidden();
    await toPreview(page);
    await expect(page.locator('#case')).toContainText(CASE_NO);
    await expect(page.locator('#case-chip')).toHaveText(`Case ${CASE_NO} · Approved in principle`);
    await expect(page).toHaveTitle(`Case ${CASE_NO} · Approved in principle — David Purvis`);
    await fromPreviewToDisposition(page);
    await expect(page.locator('#case')).toContainText('Stated scope: Platform / SRE.');
    await expect(page.locator('#case')).toContainText('Résumé requests on file: 2.');
    const open = page.getByRole('link', { name: 'Open résumé (Platform / SRE)' });
    await expect(open).toBeFocused();
    await expect(page).toHaveTitle('Case closed — David Purvis');
    await open.click();
    await expect(page).toHaveURL(/\/resume\/for\/plt\/$/);
    await expect(page.locator('#case, .case-chip')).toHaveCount(0);
    await done();
  });

  test('J2 keyboard only: every step reachable, focus moves to each new heading', async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'View résumé' }).focus();
    await page.keyboard.press('Enter');
    await expect(heading(page)).toBeFocused();
    await expect(heading(page)).toHaveText('Scope clarification');
    const first = page.getByRole('radio', { name: 'Embedded software' });
    await first.focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('radio', { name: 'Platform / SRE' })).toBeChecked();
    await page.getByRole('button', { name: 'Submit scope' }).focus();
    await page.keyboard.press('Enter');
    await expect(heading(page)).toHaveText('Approved in principle');
    await expect(heading(page)).toBeFocused();
    for (const [button, next] of [
      ['Request full document', 'Preliminary determination'],
      ['Proceed to adjudication', 'Conditional approval'],
      ['Acknowledge', 'Confirm acknowledgment'],
    ] as const) {
      await page.getByRole('button', { name: button }).focus();
      await page.keyboard.press('Enter');
      await expect(heading(page)).toHaveText(next);
      await expect(heading(page)).toBeFocused();
    }
    await page.getByRole('button', { name: 'Confirm' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: /Open résumé/ })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/resume\/for\/plt\/$/);
  });

  test('J3 reduced motion: the same case, the same outcome', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await toPreview(page);
    await fromPreviewToDisposition(page);
    await expect(page.locator('#case')).toContainText('Stated scope: Platform / SRE.');
  });

  test('J5 expedite: two activations to the résumé', async ({ page }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'View résumé' }).click();
    await page.getByRole('button', { name: 'Request expedited processing' }).click();
    await expect(heading(page)).toHaveText('Case closed');
    await expect(page.locator('#case')).toContainText('It was always available.');
    await page.getByRole('link', { name: 'Open résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });

  test('J6 direct: the header link is never intercepted, mid-case included @smoke', async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'View résumé' }).click();
    await expect(heading(page)).toHaveText('Scope clarification');
    await page
      .getByRole('navigation', { name: 'Site' })
      .getByRole('link', { name: 'Résumé' })
      .click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await page.goBack();
    await page.getByRole('link', { name: 'Open the résumé directly' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });

  test('J7 print: printing approves the request and prints only the résumé', async ({ page }) => {
    await page.goto('./');
    await toPreview(page);
    await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
    await expect(heading(page)).toHaveText('Case closed');
    await expect(page.locator('#case')).toContainText('Institutional control of printed matter');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.print-only .resume')).toBeVisible();
    await expect(page.locator('main')).toBeHidden();
  });

  test('J8 reload: the case survives a refresh, and says so once', async ({ page }) => {
    await page.goto('./');
    await toPreview(page);
    await page.reload();
    await expect(heading(page)).toHaveText('Approved in principle');
    await expect(page.locator('#case')).toContainText(CASE_NO);
    await expect(page.locator('#case-status')).toHaveText(
      'Case continuity confirmed. This case survived a refresh.',
    );
    const stored = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem('uvcr:case') ?? '{}'),
    );
    expect(stored.seed).toBe(SEED);
    expect(stored.events.at(-1)).toEqual({ t: 'SESSION_RELOADED' });
  });

  test('J10 service unavailable: a step that cannot load approves the request', async ({
    page,
  }) => {
    await page.route('**/_assets/findings.*.js', (route) => route.abort());
    await page.goto('./');
    await toPreview(page);
    await page.getByRole('button', { name: 'Request full document' }).click();
    await expect(heading(page)).toHaveText('Case closed');
    await expect(page.locator('#case')).toContainText('approved by default');
  });

  test('J11 after authorization the page is ordinary, and the CTA simply works', async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByRole('link', { name: 'View résumé' }).click();
    await page.getByRole('button', { name: 'Request expedited processing' }).click();
    await page.getByRole('link', { name: 'Open résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await page.goBack();
    await expect(heading(page)).toHaveText('Case closed');
    await page.getByRole('link', { name: 'View résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });
});

test('a restored mid-case visit does not steal focus', async ({ page }) => {
  await seedCase(page, { seed: SEED, events: [OPEN, SCOPE_PLT] });
  await page.goto('./');
  await expect(heading(page)).toHaveText('Approved in principle');
  await expect(heading(page)).not.toBeFocused();
});
