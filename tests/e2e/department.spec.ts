/**
 * The Department as a whole: the opening, the six-category directory, shared navigation, related
 * offices, Direct access, and settings in Facilities. Procedures and their payoffs have their own
 * specs; this one checks that the institution is coherent and nonlinear.
 */
import { expect, test, type Page } from '@playwright/test';
import { SERVICE_ROUTES, seedPrefs, watchErrors } from './helpers';
import { DIRECTORY } from '../../src/content/department/directory';

const directAccess = (page: Page) =>
  page.locator('header').getByRole('switch', { name: 'Direct access' });

test.describe('the front desk', () => {
  test('opens with the Department’s authority, then the directory @smoke', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('./');
    const opening = page.locator('.opening');
    await expect(opening.getByRole('heading', { level: 1 })).toHaveText(
      'Department of David Purvis',
    );
    await expect(opening).toContainText('Public access to information concerning David Purvis.');
    await expect(opening.locator('dt')).toHaveText(['Subject', 'Capability']);
    await expect(opening.locator('dd')).toHaveText(['David Purvis', 'Good at computers.']);

    // Six categories, in order, each with its own anchor.
    const headings = page.locator('#directory h3');
    await expect(headings).toHaveText(DIRECTORY.map((c) => c.title));
    for (const c of DIRECTORY) await expect(page.locator(`section#${c.id}`)).toHaveCount(1);
    await done();
  });

  test('every page service in the directory is an ordinary link, usable in any order', async ({
    page,
  }) => {
    await page.goto('./');
    for (const c of DIRECTORY)
      for (const s of c.services.filter((x) => x.path)) {
        const link = page.locator(`section#${c.id}`).getByRole('link', { name: s.label });
        await expect(link, s.label).toHaveAttribute('href', new RegExp(`${s.path}$`));
      }
  });
});

test.describe('shared navigation', () => {
  test('the directory menu opens, and closes with Escape or a click elsewhere', async ({
    page,
  }) => {
    await page.goto('about/');
    const menu = page.locator('[data-menu]');
    const summary = menu.locator('> summary');
    await summary.click();
    await expect(menu).toHaveAttribute('open', '');
    for (const c of DIRECTORY)
      await expect(menu.getByRole('link', { name: c.title, exact: true })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(menu).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await summary.click();
    await page.locator('main h1').click();
    await expect(menu).not.toHaveAttribute('open', '');
  });

  test('every department page names related offices and returns to its category', async ({
    page,
  }) => {
    for (const c of DIRECTORY) {
      const pages = c.services.filter((s) => s.path);
      const first = pages[0];
      if (!first?.path) continue;
      await page.goto(first.path.slice(1));
      const offices = page.locator('nav.offices');
      const back = offices.getByRole('link', { name: 'Return to the directory' });
      await expect(back, c.id).toHaveAttribute('href', new RegExp(`/#${c.id}$`));
      for (const other of pages.slice(1))
        await expect(offices.getByRole('link', { name: other.label }), other.label).toBeVisible();
    }
  });

  test('no page asks visitors to continue anywhere in particular', async ({ request }) => {
    for (const r of SERVICE_ROUTES) {
      const html = await (await request.get(r)).text();
      expect(html, r).not.toMatch(/>\s*Continue to /);
    }
  });
});

test.describe('Direct access', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('suspends procedures, persists across pages, and keeps every page @smoke', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(directAccess(page)).toHaveAttribute('aria-checked', 'false');
    await directAccess(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
    // Both switches on the front desk agree.
    await expect(
      page.locator('#facilities').getByRole('switch', { name: 'Direct access' }),
    ).toHaveAttribute('aria-checked', 'true');
    await expect(page.locator('#recreation [data-doom-dock]')).toBeHidden();
    await page.goto('casino/');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
    await expect(directAccess(page)).toHaveAttribute('aria-checked', 'true');
    await directAccess(page).click();
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'chaos');
  });

  test('?mode=recruiter turns it on, and ?mode=chaos turns it off', async ({ page }) => {
    await page.goto('skills/?mode=recruiter');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
    await expect(directAccess(page)).toHaveAttribute('aria-checked', 'true');
    await page.goto('skills/');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'recruiter');
    await page.goto('skills/?mode=chaos');
    await expect(page.locator('html')).toHaveAttribute('data-mode', 'chaos');
  });
});

test.describe('Facilities', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
  });

  test('display settings cycle and persist to other pages', async ({ page }) => {
    await page.goto('./#facilities');
    await page.locator('#facilities [data-theme-cycle]').click();
    const theme = await page.locator('html').getAttribute('data-theme');
    expect(theme).toMatch(/^(light|dark|darker)$/);
    await page.goto('about/');
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme ?? '');
  });

  test('the docked DOOM player opens only on request, and closes back to its opener', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(page.locator('[data-doom-dock-root], .doom-dock')).toHaveCount(0);
    const open = page.locator('#recreation [data-doom-dock]');
    await open.click();
    const dock = page.getByRole('dialog').or(page.getByRole('region', { name: /DOOM/ }));
    await expect(dock.first()).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(open).toBeFocused();
  });
});

test.describe('terms of reading', () => {
  test('the terms grow as they are read, then one sentence ends the interaction', async ({
    page,
  }) => {
    await page.goto('legal/');
    const accept = page.getByRole('button', { name: 'I have read this sentence.' });
    await expect(accept).toHaveAttribute('aria-disabled', 'true');
    const box = page.locator('[data-tos]');
    for (let i = 0; i < 12; i++) {
      await box.evaluate((el) => el.scrollTo(0, el.scrollHeight));
      if ((await accept.getAttribute('aria-disabled')) === null) break;
      await page.waitForTimeout(100);
    }
    await expect(box).toContainText('§4.2 By reading this sentence, you have read this sentence.');
    await expect(accept).not.toHaveAttribute('aria-disabled', 'true');
    await accept.click();
    await expect(page.locator('[data-tos-receipt]')).toHaveText('Reading acknowledged.');
    await expect(accept).toBeHidden();
  });
});

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false });

  test('the directory is a set of links, and procedure controls stay out of the way', async ({
    page,
  }) => {
    await page.goto('./');
    await expect(
      page.locator('#visitor-services').getByRole('link', { name: 'Verification' }),
    ).toBeVisible();
    await expect(page.locator('[data-open-identity]')).toBeHidden();
    await expect(page.locator('[data-cookie-admin]')).toBeHidden();
    await expect(directAccess(page)).toBeHidden();
    await page.getByRole('link', { name: 'Request résumé' }).click();
    await expect(page).toHaveURL(/\/resume\/$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('David Purvis');
  });
});
