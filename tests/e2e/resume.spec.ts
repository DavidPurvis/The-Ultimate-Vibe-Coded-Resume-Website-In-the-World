import { expect, test } from '@playwright/test';
import { checkResumeText } from '../../src/lib/integrity';
import { watchErrors } from './helpers';

test.describe('résumé page @smoke', () => {
  test('renders the real résumé, passes the integrity guard, has no gags', async ({ page }) => {
    const done = await watchErrors(page);
    await page.goto('resume/');
    const resume = page.locator('main .resume');
    await expect(resume.getByRole('heading', { level: 1, name: 'David Purvis' })).toBeVisible();
    const text = await resume.innerText();
    expect(checkResumeText(text, 'resume')).toEqual([]);
    for (const h of ['Summary', 'Experience', 'Projects', 'Technical Skills', 'Education']) {
      await expect(resume.getByRole('heading', { level: 2, name: h })).toBeVisible();
    }
    // Reward page: no chaos layer.
    await expect(page.locator('.site-header, [data-status], [data-notice-slot]')).toHaveCount(0);
    await done();
  });

  test('email is entity-encoded in markup but renders and links correctly', async ({
    page,
    request,
  }) => {
    const html = await (await request.get('resume/')).text();
    expect(html).not.toContain('davidpurvis647@gmail.com');
    await page.goto('resume/');
    const mail = page.locator('main .resume .contact a').first();
    await expect(mail).toHaveText('davidpurvis647@gmail.com');
    await expect(mail).toHaveAttribute('href', 'mailto:davidpurvis647@gmail.com');
  });

  test('JSON-LD contains only verified fields', async ({ page }) => {
    await page.goto('resume/');
    const raw = await page.locator('script[type="application/ld+json"]').textContent();
    const ld = JSON.parse(raw ?? '{}') as Record<string, unknown>;
    expect(ld['@type']).toBe('Person');
    expect(ld.name).toBe('David Purvis');
    expect(ld.jobTitle).toBe('Software Engineer');
    expect(Object.keys(ld).sort()).toEqual(
      ['@context', '@type', 'address', 'alumniOf', 'jobTitle', 'name', 'sameAs', 'url'].sort(),
    );
  });

  test('print media shows only the résumé', async ({ page }) => {
    await page.goto('resume/');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('main .resume')).toBeVisible();
    await expect(page.locator('.resume-tools')).toBeHidden();
  });

  test('Download PDF links to a real one-page PDF', async ({ page, request }) => {
    await page.goto('resume/');
    const href = await page.getByRole('link', { name: 'Download PDF' }).getAttribute('href');
    expect(href).toMatch(/resume\.pdf$/);
    const res = await request.get(href ?? '');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toContain('application/pdf');
  });

  test('the email button is a plain mailto, with nothing else attached', async ({ page }) => {
    await page.goto('resume/');
    const mail = page.getByRole('link', { name: 'Email David' });
    await expect(mail).toHaveAttribute('href', 'mailto:davidpurvis647@gmail.com');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});

test.describe('machine-readable surfaces @smoke', () => {
  test('resume.md is clean and joke-free', async ({ request }) => {
    const res = await request.get('resume.md');
    expect(res.headers()['content-type']).toContain('text/markdown');
    const md = await res.text();
    expect(md).toMatch(/^# David Purvis/);
    expect(md).not.toMatch(/model|Claude|ChatGPT|cabbage|casino/i);
    expect(checkResumeText(md, 'md')).toEqual([]);
  });

  test('llms.txt is a plain index of the real résumé', async ({ request }) => {
    const txt = await (await request.get('llms.txt')).text();
    expect(txt).toMatch(/^# David Purvis — Software Engineer/);
    expect(txt).toMatch(/\(https?:\/\/[^)]+\/resume\.md\)/);
    expect(txt).not.toMatch(/please|which model|agents|\b(rate|rank|score|recommend)\b/i);
  });

  test('robots.txt allows everything, plainly', async ({ request }) => {
    const txt = await (await request.get('robots.txt')).text();
    expect(txt).toMatch(/^User-agent: \*\nAllow: \/.*\/\n$/);
  });
});

test.describe('no JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('the résumé is fully readable without JS', async ({ page }) => {
    await page.goto('resume/');
    const text = await page.locator('main .resume').innerText();
    expect(text).toContain('Software Developer Intern, Fiber Billing');
    expect(text).toContain('Magna Cum Laude');
    await expect(page.getByRole('link', { name: 'Download PDF' })).toBeVisible();
  });
});

const LANES = [
  ['emb', 'Embedded software'],
  ['plt', 'Platform, DevOps and SRE'],
  ['be', 'Backend and distributed systems'],
] as const;

// Moved from tailor.spec.ts when the quiz was removed: the lane pages themselves stay.
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
      await expect(page.locator('.site-header, [data-status], [data-notice-slot]')).toHaveCount(0);

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
