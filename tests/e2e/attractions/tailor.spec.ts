import { expect, test, type Page } from '@playwright/test';
import { checkResumeText } from '../../../src/lib/integrity';
import { seedPrefs, watchErrors } from '../helpers';

const LANES = [
  ['emb', 'Embedded software'],
  ['plt', 'Platform, DevOps and SRE'],
  ['be', 'Backend and distributed systems'],
] as const;

async function assemble(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Assemble my résumé' }).click();
  await expect(page.locator('[data-tailor-result]')).toBeVisible();
}

test.describe('Résumé For You', () => {
  test.beforeEach(async ({ page }) => {
    await seedPrefs(page);
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('the quiz picks a verified cut and links its page and PDF @smoke', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('tailor/');
    await page.getByRole('radio', { name: 'Embedded software or embedded Linux' }).check();
    await assemble(page);
    const result = page.locator('[data-tailor-result]');
    await expect(result).toBeFocused();
    await expect(result).toContainText('Recommended cut: Embedded software');
    await expect(result.getByRole('link', { name: 'Open this cut' })).toHaveAttribute(
      'href',
      /\/resume\/for\/emb\/$/,
    );
    await expect(result.getByRole('link', { name: 'Download the PDF' })).toHaveAttribute(
      'href',
      /\/resume-emb\.pdf$/,
    );
    await done();
  });

  test('the Claude link is pre-filled, opt-in, and nothing leaves the page before a click', async ({
    page,
  }) => {
    await page.goto('tailor/');
    const requests: string[] = [];
    page.on('request', (r) => requests.push(`${r.method()} ${r.url()}`));

    await page.getByRole('radio', { name: 'Backend or distributed systems' }).check();
    await page.getByRole('radio', { name: 'Integrations, pipelines and throughput' }).check();
    await page.getByLabel(/Paste the job description/).fill('Ingeniería backend: “pipelines”.');
    await assemble(page);

    const link = page.getByRole('link', { name: /Tailor it with Claude/ });
    await expect(link).toHaveAttribute('target', '_blank');
    await expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    const href = (await link.getAttribute('href')) ?? '';
    expect(href.startsWith('https://claude.ai/new?q=')).toBe(true);
    const sent = decodeURIComponent(href.split('?q=')[1] ?? '');
    expect(sent).toContain('Role: Backend or distributed systems');
    expect(sent).toContain('Ingeniería backend: “pipelines”.');
    expect(sent).toContain('Use only the facts in the resume below.');
    expect(sent).toContain('Software Developer Intern, Fiber Billing');

    const box = page.getByLabel('The message it will pre-fill');
    await expect(box).toHaveAttribute('readonly', '');
    expect(await box.inputValue()).toBe(sent);
    await expect(page.locator('[data-tr-truncated]')).toBeHidden();

    // Nothing left this origin, and nothing was sent: only same-origin GETs (the quiz's own chunk).
    expect(requests.filter((r) => !r.startsWith('GET http://127.0.0.1:'))).toEqual([]);
    expect(requests.filter((r) => !/\.(woff2?|svg|png|js)$/.test(r))).toEqual([]);
    expect(page.url()).not.toContain('?');
  });

  test('fans are sorted by what matters most, and the result follows later answers', async ({
    page,
  }) => {
    await page.goto('tailor/');
    await page.getByRole('radio', { name: 'Nothing. I just like the website.' }).check();
    await page.getByRole('radio', { name: 'Owning a production system end to end' }).check();
    await assemble(page);
    const result = page.locator('[data-tailor-result]');
    await expect(result).toContainText('Recommended cut: Platform, DevOps and SRE');
    await expect(result).toContainText('You just like the website. Respect.');

    await page.getByRole('radio', { name: 'General software engineering' }).check();
    await expect(result).toContainText('Recommended cut: General software engineering');
    await expect(result.getByRole('link', { name: 'Open this cut' })).toHaveAttribute(
      'href',
      /\/resume\/$/,
    );
  });

  test('a nickname request loses to HR', async ({ page }) => {
    await page.goto('tailor/');
    await page.getByLabel('Which name should appear on your copy?').selectOption('Big Purv');
    await assemble(page);
    await expect(page.locator('[data-tr-alias]')).toHaveText(
      'Name on the résumé: David Purvis. You asked for “Big Purv”. HR asked for the legal name. HR wins.',
    );
  });

  test('a long job description is shortened in the link only', async ({ page }) => {
    await page.goto('tailor/');
    const jd = page.getByLabel(/Paste the job description/);
    await jd.fill('Designs, builds and operates reliable backend services. '.repeat(80));
    await expect(page.locator('[data-tq-counter]')).toHaveText('3,000 of 3,000 characters');
    await page.getByRole('radio', { name: 'Platform, DevOps or SRE' }).check();
    await assemble(page);
    await expect(page.locator('[data-tr-truncated]')).toBeVisible();
    const href = (await page
      .getByRole('link', { name: /Tailor it with Claude/ })
      .getAttribute('href')) as string;
    expect(href.length).toBeLessThanOrEqual(8000);
    const box = await page.getByLabel('The message it will pre-fill').inputValue();
    expect(box.length).toBeGreaterThan(decodeURIComponent(href.split('?q=')[1] ?? '').length);
  });

  test('Direct access keeps the quiz and drops the nickname question', async ({ page }) => {
    await seedPrefs(page, { mode: 'recruiter' });
    await page.goto('tailor/');
    await expect(page.getByLabel('Which name should appear on your copy?')).toBeHidden();
    await page.getByRole('radio', { name: 'Embedded software or embedded Linux' }).check();
    await assemble(page);
    await expect(page.locator('[data-tailor-result]')).toContainText('Embedded software');
  });
});

test.describe('Résumé For You without JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the cuts are still one click away', async ({ page }) => {
    await page.goto('tailor/');
    await expect(page.getByRole('button', { name: 'Assemble my résumé' })).toBeHidden();
    const skip = page.getByRole('navigation', { name: 'Other cuts of this résumé' });
    for (const name of ['Standard (general)', 'Embedded', 'Platform / SRE', 'Backend'])
      await expect(skip.getByRole('link', { name })).toBeVisible();
  });
});

test.describe('lane résumés', () => {
  for (const [id, label] of LANES) {
    test(`resume/for/${id}/ is a clean, verified one-page cut @smoke`, async ({
      page,
      request,
    }) => {
      const done = await watchErrors(page);
      await page.goto(`resume/for/${id}/`);
      const resume = page.locator('main .resume');
      await expect(resume.getByRole('heading', { level: 1, name: 'David Purvis' })).toBeVisible();
      expect(checkResumeText(await resume.innerText(), 'resume')).toEqual([]);
      await expect(page.getByText(`Cut for: ${label}`)).toBeVisible();
      await expect(page.locator('.cookie-banner, [data-threat], .site-header')).toHaveCount(0);

      const nav = page.getByRole('navigation', { name: 'Other cuts of this résumé' });
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute(
        'href',
        new RegExp(`/resume/for/${id}/$`),
      );

      const pdf = page.getByRole('link', { name: 'Download PDF' });
      const href = (await pdf.getAttribute('href')) ?? '';
      expect(href).toMatch(new RegExp(`resume-${id}\\.pdf$`));
      const res = await request.get(href);
      expect(res.status()).toBe(200);
      expect(res.headers()['content-type']).toContain('application/pdf');

      await page.emulateMedia({ media: 'print' });
      await expect(resume).toBeVisible();
      await expect(page.locator('.resume-tools, .lane-bar, .lane-switcher')).toHaveCount(3);
      for (const el of await page.locator('.resume-tools, .lane-bar, .lane-switcher').all())
        await expect(el).toBeHidden();
      await done();
    });
  }

  test('the standard résumé links every cut', async ({ page }) => {
    await page.goto('resume/');
    const nav = page.getByRole('navigation', { name: 'Other cuts of this résumé' });
    await expect(nav.getByRole('link')).toHaveCount(4);
    await expect(nav.locator('[aria-current="page"]')).toHaveText('Standard (general)');
  });
});
