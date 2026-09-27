/**
 * The clean-résumé boundary: once the visitor reaches the résumé, the institution is gone. No
 * case runtime, no institutional copy, no storage access, on every cut and in resume.md.
 */
import { expect, test } from '@playwright/test';
import { institutionStrings } from '../../src/content/institution/strings';
import { seedCase } from './helpers';

const RESUMES = ['resume/', 'resume/for/emb/', 'resume/for/plt/', 'resume/for/be/'];
const STRINGS = institutionStrings();

test.describe('clean résumé boundary @smoke', () => {
  test('résumé pages and resume.md contain no institutional copy', async ({ request }) => {
    expect(STRINGS.length).toBeGreaterThan(20);
    for (const r of [...RESUMES, 'resume.md']) {
      const text = await (await request.get(r)).text();
      for (const s of STRINGS) expect(text, `${r}: "${s}"`).not.toContain(s);
    }
  });

  test('résumé pages load no case runtime and never touch the case record', async ({
    page,
    request,
  }) => {
    for (const r of RESUMES) {
      const html = await (await request.get(r)).text();
      expect(html, r).not.toContain('uvcr:case');
      const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1] ?? '');
      for (const src of srcs) {
        const js = await (await request.get(`http://127.0.0.1:4321${src}`)).text();
        expect(js, `${r} ${src}`).not.toContain('uvcr:case');
        expect(js, `${r} ${src}`).not.toContain('Department of Recruiter Verification');
      }
    }
    void page;
  });

  test('with a case open in the same tab, the résumé is still completely ordinary', async ({
    page,
  }) => {
    await seedCase(page, { events: [{ t: 'RESUME_REQUESTED', via: 'cta' }] });
    await page.goto('resume/');
    await expect(page).toHaveTitle(/^David Purvis/);
    await expect(page.locator('#case, #case-chip, .notice')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-case', /.*/);
    const body = await page.locator('body').innerText();
    for (const s of STRINGS) expect(body).not.toContain(s);
  });
});
