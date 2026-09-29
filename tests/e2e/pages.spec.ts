import { expect, test } from '@playwright/test';
import { watchErrors } from './helpers';
import { checkResumeText } from '../../src/lib/integrity';
import { LEDGER } from '../../src/content/credits';
import { departmentStrings } from '../../src/content/department/strings';

test.describe('projects', () => {
  test('rendered project text passes the integrity guard @smoke', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('projects/');
    const claims = await page.locator('main article').allInnerTexts();
    expect(claims).toHaveLength(4);
    expect(checkResumeText(claims.join('\n'), 'projects')).toEqual([]);
    for (const id of ['car-thing', 'stream-deck', 'homelab', 'dashboard'])
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    await expect(page.locator('#car-thing')).toContainText('Known issue');
    await expect(page.getByRole('link', { name: 'github.com/DavidPurvis' })).toHaveAttribute(
      'href',
      'https://github.com/DavidPurvis',
    );
    await done();
  });
});

test.describe('how it was built', () => {
  test('every section discloses a limitation and the colophon links out', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('how-it-was-built/');
    const sections = page.locator('section.disclosure');
    const limits = page.locator('section.disclosure .limitation');
    expect(await limits.count()).toBe((await sections.count()) - 1);
    for (const [name, href] of [
      ['What this site stores', /\/privacy\/$/],
      ['Credits and licences', /\/credits\/$/],
      ['Play DOOM', /\/doom\/$/],
      ['In memoriam: Terry A. Davis', /\/tribute\/$/],
    ] as const)
      await expect(page.getByRole('link', { name })).toHaveAttribute('href', href);
    await done();
  });
});

test.describe('credits', () => {
  test('every ledger file is served and every entry names its licence @smoke', async ({
    page,
    request,
  }) => {
    await page.goto('credits/');
    for (const e of LEDGER)
      await expect(page.locator(`[data-ledger="${e.id}"]`)).toContainText(e.license);
    const files = LEDGER.flatMap((e) => e.files ?? []);
    expect(files.length).toBeGreaterThan(0);
    for (const f of files) expect((await request.get(f)).status(), f).toBe(200);
  });
});

test.describe('404', () => {
  test('unknown paths get a real 404 with stationary exits @smoke', async ({ page, request }) => {
    expect((await request.get('definitely-not-a-page/')).status()).toBe(404);
    await page.goto('definitely-not-a-page/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Record not found.');
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    const exit = page.locator('main').getByRole('link', { name: 'Résumé', exact: true });
    const before = await exit.boundingBox();
    await exit.hover();
    expect(await exit.boundingBox()).toEqual(before);
    await exit.click();
    await expect(page).toHaveURL(/\/resume\/$/);
  });
});

test.describe('outside the Department', () => {
  test('the tribute carries no status, notices, procedures or scripts of its own', async ({
    request,
  }) => {
    const html = await (await request.get('tribute/')).text();
    expect(html).toMatch(/<html[^>]* data-plain/);
    expect(html).not.toMatch(/data-status|data-notice-slot|data-mode-toggle|data-parody-ad/);
    expect(html).not.toMatch(/<script type="module"/);
    expect(html).not.toContain(departmentStrings().find((s) => s.startsWith('Suspends')) ?? '');
  });
});
