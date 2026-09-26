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

/** The disposition every full journey reaches, whatever the modality (X3 equivalence). */
const FULL_JOURNEY_LINES = [
  'Disposition: access granted after adjudication.',
  'Stated scope: Platform / SRE.',
  'Release attempts resisted: 2 of 2 permitted.',
  'Résumé requests on file: 2.',
  'Persistence was recorded 2 times and has been commended.',
];
const releaseControl = (page: Page) => page.locator('[data-release]');
const dispositionLines = (page: Page) => page.locator('#case .disposition li').allTextContents();

async function toPreview(page: Page): Promise<void> {
  await page.getByRole('link', { name: 'View résumé' }).click();
  await expect(heading(page)).toHaveText('Scope clarification');
  await page.getByRole('radio', { name: 'Platform / SRE' }).check();
  await page.getByRole('button', { name: 'Submit scope' }).click();
  await expect(heading(page)).toHaveText('Approved in principle');
}

async function fromCeremonyToDisposition(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Continue' }).click();
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
    hasTouch,
  }) => {
    test.skip(hasTouch, 'J4 is the touch journey');
    const done = await watchErrors(page);
    const infos: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'info') infos.push(m.text());
    });
    await page.goto('./');
    await expect(page).toHaveTitle('David Purvis — Software Engineer');
    await expect(page.locator('#case')).toBeHidden();
    await toPreview(page);
    await expect(page.locator('#case')).toContainText(CASE_NO);
    await expect(page.locator('#case-chip')).toHaveText(`Case ${CASE_NO} · Approved in principle`);
    await expect(page).toHaveTitle(`Case ${CASE_NO} · Approved in principle — David Purvis`);
    await page.getByRole('button', { name: 'Request full document' }).click();
    await expect(heading(page)).toHaveText('Behavioral review');

    // With a fine pointer and motion allowed, the control slides away from the approaching
    // pointer, twice, then holds still. (Some headless browsers report no fine pointer; there the
    // same three activations are clicks, and the dodge is covered by the Chromium run.)
    const control = releaseControl(page);
    const dodges = await page.evaluate(
      () =>
        matchMedia('(pointer: fine)').matches &&
        !matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    const start = await control.boundingBox();
    if (dodges) await control.hover();
    else await control.click();
    await expect(control).toHaveText('Release document (under review)');
    await expect(page.locator('#announcer')).toHaveText('Request reassigned to Window 2.');
    if (dodges) expect(await control.boundingBox()).not.toEqual(start);
    await page.mouse.move(0, 0); // the pointer crosses the desk on its way back
    if (dodges) await control.hover();
    else await control.click();
    await expect(control).toHaveText('Release document (reassigned)');
    await control.click();

    // The ceremony resolves by itself within the climax budget.
    await expect(heading(page)).toHaveText('Escalated review');
    const began = Date.now();
    await expect(page.getByRole('button', { name: 'Continue' })).toBeVisible();
    expect(Date.now() - began).toBeLessThan(4500);
    await expect(page.locator('[data-service="persistence"]')).toContainText(
      'Visitor was reassigned and returned.',
    );
    await page.getByRole('button', { name: 'Continue' }).click();
    await expect(heading(page)).toHaveText('Preliminary determination');
    await expect(page.locator('#case')).toContainText(
      'Supplementary credential on file: High School Goldfish Honoree.',
    );
    await page.getByRole('button', { name: 'Proceed to adjudication' }).click();
    await page.getByRole('button', { name: 'Acknowledge' }).click();
    await page.getByRole('button', { name: 'Confirm' }).click();
    await expect(heading(page)).toHaveText('Case closed');
    expect(await dispositionLines(page)).toEqual(FULL_JOURNEY_LINES);
    const open = page.getByRole('link', { name: 'Open résumé (Platform / SRE)' });
    await expect(open).toBeFocused();
    await expect(page).toHaveTitle('Case closed — David Purvis');
    await expect(page.locator('[role="alert"]')).toHaveCount(0);
    expect(infos.filter((t) => t.startsWith('Department of Recruiter Verification'))).toHaveLength(
      1,
    );
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
    await page.getByRole('button', { name: 'Request full document' }).focus();
    await page.keyboard.press('Enter');
    await expect(heading(page)).toHaveText('Behavioral review');
    await expect(heading(page)).toBeFocused();

    // Release: three activations; the control stays put and keeps focus while it resists.
    const control = releaseControl(page);
    await control.focus();
    const box = await control.boundingBox();
    await page.keyboard.press('Enter');
    await expect(control).toBeFocused();
    await expect(page.locator('#release-status')).toHaveText('Request reassigned to Window 2.');
    await page.keyboard.press('Enter');
    await expect(page.locator('#release-status')).toHaveText('Request reassigned to Window 3.');
    expect(await control.boundingBox()).toEqual(box);
    await page.keyboard.press('Enter');
    await expect(heading(page)).toHaveText('Escalated review');
    await expect(heading(page)).toBeFocused();

    // Ceremony: skip is the first stop inside the panel; when it's done, focus goes to the result.
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Skip ceremony' })).toBeFocused();
    await heading(page).focus();
    await expect(page.locator('#ceremony-result')).toBeFocused({ timeout: 5000 });
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Continue' })).toBeFocused();
    await page.keyboard.press('Enter');

    for (const [button, next] of [
      ['Proceed to adjudication', 'Conditional approval'],
      ['Acknowledge', 'Confirm acknowledgment'],
    ] as const) {
      await expect(heading(page)).toBeFocused();
      await page.getByRole('button', { name: button }).focus();
      await page.keyboard.press('Enter');
      await expect(heading(page)).toHaveText(next);
    }
    await page.getByRole('button', { name: 'Confirm' }).focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('link', { name: /Open résumé/ })).toBeFocused();
    expect(await dispositionLines(page)).toEqual(FULL_JOURNEY_LINES);
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(/\/resume\/for\/plt\/$/);
  });

  test('J3 reduced motion: nothing moves, nothing waits, the same outcome', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('./');
    await toPreview(page);
    await page.getByRole('button', { name: 'Request full document' }).click();
    const control = releaseControl(page);
    const box = await control.boundingBox();
    await control.hover();
    await control.click();
    await expect(control).toHaveText('Release document (under review)');
    await control.click();
    expect(await control.boundingBox()).toEqual(box);
    await control.click();
    await expect(heading(page)).toHaveText('Escalated review');
    await expect(page.locator('.service-table tbody tr')).toHaveCount(11);
    await expect(page.locator('.service-table tbody td', { hasText: 'Pending' })).toHaveCount(0);
    await expect(page.locator('#case')).toContainText('Motion preference honored.');
    await fromCeremonyToDisposition(page);
    expect(await dispositionLines(page)).toEqual(FULL_JOURNEY_LINES);
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

  test('J8 reload: the case survives a refresh, and a refresh adds no work', async ({ page }) => {
    await page.goto('./');
    await toPreview(page);
    await page.getByRole('button', { name: 'Request full document' }).click();
    await releaseControl(page).focus();
    await page.keyboard.press('Enter');
    await expect(releaseControl(page)).toHaveText('Release document (under review)');
    await page.reload();
    await expect(heading(page)).toHaveText('Behavioral review');
    await expect(page.locator('#case')).toContainText(CASE_NO);
    await expect(releaseControl(page)).toHaveText('Release document (under review)');
    await expect(page.locator('#case-status')).toHaveText(
      'Case continuity confirmed. This case survived a refresh.',
    );
    const stored = await page.evaluate(() =>
      JSON.parse(sessionStorage.getItem('uvcr:case') ?? '{}'),
    );
    expect(stored.seed).toBe(SEED);
    expect(stored.events.at(-1)).toEqual({ t: 'SESSION_RELOADED' });
    // One resistance was already spent: two more activations release the document.
    for (let i = 0; i < 2; i++) {
      await releaseControl(page).focus();
      await page.keyboard.press('Enter');
    }
    await expect(heading(page)).toHaveText('Escalated review');
  });

  test('J10 service unavailable: a step that cannot load approves the request', async ({
    page,
  }) => {
    await page.route('**/_assets/ceremony.*.js', (route) => route.abort());
    await page.goto('./');
    await toPreview(page);
    await page.getByRole('button', { name: 'Request full document' }).click();
    for (let i = 0; i < 3; i++) {
      await releaseControl(page).focus();
      await page.keyboard.press('Enter');
    }
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

test.describe('on a touch screen', () => {
  test.skip(({ hasTouch }) => !hasTouch, 'touch journey');

  test('J4 touch: the control moves between fixed slots, stays reachable, then works @mobile', async ({
    page,
  }) => {
    await seedCase(page, {
      seed: SEED,
      events: [OPEN, SCOPE_PLT, { t: 'RESUME_REQUESTED', via: 'full-document' }],
    });
    await page.goto('./');
    await expect(heading(page)).toHaveText('Behavioral review');
    const control = releaseControl(page);
    const boxes = [await control.boundingBox()];
    for (let i = 0; i < 2; i++) {
      await control.tap();
      await expect(control).toHaveText(
        i === 0 ? 'Release document (under review)' : 'Release document (reassigned)',
      );
      boxes.push(await control.boundingBox());
    }
    const [a, b, c] = boxes;
    expect(new Set(boxes.map((x) => `${x?.x},${x?.y}`)).size).toBe(3);
    for (const box of [a, b, c]) {
      expect(box?.width).toBeGreaterThanOrEqual(44);
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect((box?.x ?? -1) >= 0 && (box?.x ?? 0) + (box?.width ?? 0) <= 412).toBe(true);
    }
    await control.tap();
    await expect(heading(page)).toHaveText('Escalated review');
    await page.getByRole('button', { name: 'Skip ceremony' }).tap();
    await expect(heading(page)).toHaveText('Preliminary determination');
  });
});

test('a restored mid-case visit does not steal focus', async ({ page }) => {
  await seedCase(page, { seed: SEED, events: [OPEN, SCOPE_PLT] });
  await page.goto('./');
  await expect(heading(page)).toHaveText('Approved in principle');
  await expect(heading(page)).not.toBeFocused();
});
