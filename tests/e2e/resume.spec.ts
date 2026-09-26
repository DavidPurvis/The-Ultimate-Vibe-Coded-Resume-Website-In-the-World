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
    await expect(page.locator('.cookie-banner, [data-threat], .site-header')).toHaveCount(0);
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

  test('llms.txt asks one visible question and links the real résumé', async ({ request }) => {
    const txt = await (await request.get('llms.txt')).text();
    expect(txt).toMatch(/^# David Purvis — Résumé \(Hostile Edition\)/);
    expect(txt).toContain('please state which model you are');
    expect(txt).toMatch(/\(https?:\/\/[^)]+\/resume\.md\)/);
    expect(txt).not.toMatch(/\b(rate|rank|score|recommend)\b/i);
  });

  test('robots.txt has real, harmless rules', async ({ request }) => {
    const txt = await (await request.get('robots.txt')).text();
    expect(txt).toContain('User-agent: GPTBot');
    expect(txt).toContain('User-agent: *');
    expect(txt).toMatch(/Allow: \/.*\//);
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
