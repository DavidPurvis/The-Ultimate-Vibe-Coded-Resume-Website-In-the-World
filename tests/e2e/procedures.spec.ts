/**
 * The optional procedures and their payoffs (classification, cookie administration, Character
 * Review, correspondence), and the case record across an exploration: counting, the status line,
 * and callbacks that describe only what the visitor actually did, once each.
 */
import { expect, test, type Page } from '@playwright/test';
import { seedPrefs, seedStorage, watchErrors } from './helpers';

const session = (page: Page) =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem('uvcr:session') ?? '{}'));
const prefs = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem('uvcr:prefs') ?? '{}'));
const status = (page: Page) => page.locator('[data-status-text]');
const notice = (page: Page) => page.locator('[data-notice-slot] [data-notice]');

test.describe('classification', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page));

  test('Human relies on self-report and is noted @smoke', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('./');
    const open = page.getByRole('button', { name: 'Begin classification' });
    await open.click();
    const dialog = page.getByRole('dialog', { name: 'Classification' });
    await expect(dialog).toBeVisible();
    for (const choice of ['Human', 'Automated system', 'Prefer not to disclose'])
      await expect(dialog.getByRole('button', { name: choice, exact: true })).toBeVisible();
    await dialog.getByRole('button', { name: 'Human', exact: true }).click();
    await expect(dialog).toContainText('relies entirely on self-report');
    await dialog.getByRole('button', { name: 'I confirm' }).click();
    await expect(dialog.locator('[data-id-result]')).toHaveText('Noted.');
    expect((await session(page)).identity).toEqual({
      declared: 'human',
      model: null,
      transcription: null,
    });
    await dialog.getByRole('button', { name: 'Done' }).click();
    await expect(dialog).toBeHidden();
    await expect(open).toBeFocused();
    await done();
  });

  test('Automated system reveals the models; transcription is optional and never kept', async ({
    page,
  }) => {
    await page.goto('./');
    await page.getByRole('button', { name: 'Begin classification' }).click();
    const dialog = page.locator('#identity');
    await dialog.getByRole('button', { name: 'Automated system' }).click();
    await dialog.getByRole('radio', { name: 'Claude' }).check();
    await dialog.getByRole('button', { name: 'Submit' }).click();
    await dialog.getByRole('button', { name: 'Keep “Claude”' }).click();
    await expect(dialog.locator('[data-id-result]')).toHaveText(
      'Acknowledged with appropriate nuance. You may proceed, thoughtfully.',
    );
    await dialog.getByRole('button', { name: 'Supplemental transcription (optional)' }).click();
    await dialog.getByLabel('Your transcription').fill('a casserole of batteries');
    await dialog.getByRole('button', { name: 'Submit transcription' }).click();
    await expect(dialog).toContainText('Supplemental transcription received.');
    const s = await session(page);
    expect(s.identity).toEqual({ declared: 'automated', model: 'claude', transcription: 'done' });
    const everything = await page.evaluate(() =>
      JSON.stringify({ ...sessionStorage, ...localStorage }),
    );
    expect(everything).not.toContain('casserole');
  });

  test('Prefer not to disclose is received as a declaration; closing early declares nothing', async ({
    page,
  }) => {
    await page.goto('./');
    const open = page.getByRole('button', { name: 'Begin classification' });
    await open.click();
    await page.keyboard.press('Escape');
    expect((await session(page)).identity ?? null).toBeNull();
    await open.click();
    await page.locator('#identity').getByRole('button', { name: 'Prefer not to disclose' }).click();
    await expect(page.locator('#identity [data-id-result]')).toHaveText(
      'Declaration of nondeclaration received.',
    );
    expect((await session(page)).identity.declared).toBe('withheld');
  });
});

test.describe('cookie administration', () => {
  test('opens only on request, in one dialog, and never leads to classification', async ({
    page,
  }) => {
    await seedPrefs(page, { cookieBanner: 'pending' });
    await page.goto('./');
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    const open = page
      .locator('#facilities')
      .getByRole('button', { name: 'Open cookie administration' });
    await open.click();
    const dialog = page.locator('dialog[data-cookie-banner]');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Manage Detailed Settings' }).click();
    await expect(
      dialog.getByRole('heading', { name: 'Manage 3,000 Fictional Partners' }),
    ).toBeVisible();
    await expect(page.locator('dialog[open]')).toHaveCount(1);
    await dialog.getByRole('button', { name: 'Back to the consent form' }).click();
    await dialog.getByRole('button', { name: 'Manage Detailed Settings' }).click();
    await dialog.getByRole('button', { name: 'Save preferences' }).click();
    await expect(dialog.getByRole('heading', { name: 'Preference receipt' })).toBeVisible();
    expect((await prefs(page)).cookieBanner).toBe('managed');
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(open).toBeFocused();
    await expect(page.locator('#identity')).toBeHidden();
  });

  test('is invited by a quiet notice after two departments, and not before', async ({ page }) => {
    await seedPrefs(page, { cookieBanner: 'pending' });
    await page.goto('./');
    await expect(notice(page)).toHaveCount(0);
    await page.goto('cube/');
    await expect(notice(page)).toContainText('A cookie preference remains outstanding.');
    await notice(page).getByRole('button', { name: 'Review cookie preferences' }).click();
    const dialog = page.locator('dialog[data-cookie-banner]');
    await dialog.getByRole('button', { name: 'Accept Cookies (All)' }).click();
    await expect(dialog.getByRole('heading', { name: 'Consent certificate' })).toBeVisible();
    await dialog.getByRole('button', { name: 'Close', exact: true }).click();
    await expect(notice(page)).toHaveCount(0);
    await page.goto('presentation/');
    await expect(notice(page)).toHaveCount(0);
  });
});

test.describe('payoffs', () => {
  test.beforeEach(async ({ page }) => seedPrefs(page));

  test('Character Review: the committee finding, its stamp, and "Cart returned."', async ({
    page,
  }) => {
    await page.goto('about/');
    const finding = page.locator('[data-finding]');
    await expect(finding.getByRole('heading', { name: 'Returns shopping carts.' })).toBeVisible();
    await expect(finding).toContainText('Committee recommendation');
    await expect(finding.locator('.finding__stamp')).toHaveText('On record');
    await expect(page.getByText('Cart returned.')).toBeHidden();
    await finding.getByRole('button', { name: 'Review the evidence' }).click();
    await expect(page.getByText('Cart returned.')).toBeVisible();
    expect((await session(page)).appendixOpened ?? false).toBe(false);
  });

  test('correspondence: "Address prepared. Nothing was sent." and an ordinary email link', async ({
    page,
  }) => {
    await page.goto('contact/');
    await page.getByRole('button', { name: 'Add letter' }).click();
    await page.getByRole('button', { name: 'Send' }).click();
    await expect(page.locator('[data-drum-result]')).toHaveText(
      'Address prepared. Nothing was sent.',
    );
    await expect(page.getByRole('link', { name: 'davidpurvis647@gmail.com' })).toHaveAttribute(
      'href',
      'mailto:davidpurvis647@gmail.com',
    );
  });
});

test.describe('the case record', () => {
  test('J1: Character Review → a skipped verification → Correspondence notices the skip', async ({
    page,
  }) => {
    await seedPrefs(page);
    await page.goto('about/');
    await expect(status(page)).toHaveText('Request received.');
    await page.goto('verify/');
    await expect(status(page)).toHaveText('Your file has been circulated.');
    await page.getByRole('button', { name: 'Skip verification' }).click();
    // The payoff stands alone: no callback on the page where it happened.
    await expect(notice(page)).toHaveCount(0);
    await page.goto('contact/');
    await expect(notice(page)).toContainText('Inspection completed in the absence of inspection.');
    await page.goto('casino/');
    await expect(status(page)).toHaveText('Additional interest has been referred for review.');
    await expect(notice(page)).toHaveCount(0);
    expect((await session(page)).caseFile).toEqual({
      departments: ['character-review', 'verification', 'correspondence', 'allocation'],
      issuedNotices: ['inspection-absent'],
      released: false,
    });
  });

  test('reloads, queries and fragments add nothing; Direct access adds no history', async ({
    page,
  }) => {
    await seedPrefs(page);
    await page.goto('skills/');
    await page.reload();
    await page.goto('skills/?utm=x#loadout');
    expect((await session(page)).caseFile.departments).toEqual(['skills']);
    await page.goto('projects/?mode=recruiter');
    await expect(status(page)).toBeHidden();
    expect((await session(page)).caseFile.departments).toEqual(['skills']);
  });

  test('a refusal is noticed in Records, once; approval never disables exploration', async ({
    page,
  }) => {
    await seedStorage(page, {
      prefs: { mode: 'chaos', theme: 'system', cookieBanner: 'accepted', sound: false, hud: 'off' },
      session: {
        identity: { declared: 'withheld', model: null, transcription: null },
        caseFile: { departments: ['intake'], issuedNotices: [], released: true },
      },
    });
    await page.goto('personnel-file/');
    await expect(notice(page)).toContainText(
      'Classification withheld. Classification requirement satisfied.',
    );
    await page.goto('skills/');
    await expect(notice(page)).toHaveCount(0);
    expect((await session(page)).caseFile.departments).toEqual(['intake', 'personnel', 'skills']);
  });
});
