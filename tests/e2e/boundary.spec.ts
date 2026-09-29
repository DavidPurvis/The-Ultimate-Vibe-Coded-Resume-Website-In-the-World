/**
 * The clean-résumé boundary: once the visitor reaches the résumé, the Department is gone. No
 * departmental code or copy, no storage access, on every cut and in resume.md.
 */
import { expect, test } from '@playwright/test';
import { departmentStrings } from '../../src/content/department/strings';
import { seedStorage } from './helpers';

const RESUMES = ['resume/', 'resume/for/emb/', 'resume/for/plt/', 'resume/for/be/'];
const STRINGS = departmentStrings();

test.describe('clean résumé boundary @smoke', () => {
  test('résumé pages and resume.md contain no departmental copy', async ({ request }) => {
    expect(STRINGS.length).toBeGreaterThan(10);
    for (const r of [...RESUMES, 'resume.md']) {
      const text = await (await request.get(r)).text();
      for (const s of STRINGS) expect(text, `${r}: "${s}"`).not.toContain(s);
    }
  });

  test('résumé pages load no departmental code and never touch stored records', async ({
    page,
    request,
  }) => {
    for (const r of RESUMES) {
      const html = await (await request.get(r)).text();
      expect(html, r).not.toContain('uvcr:');
      const srcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1] ?? '');
      for (const src of srcs) {
        const js = await (await request.get(`http://127.0.0.1:4321${src}`)).text();
        expect(js, `${r} ${src}`).not.toContain('uvcr:');
        expect(js, `${r} ${src}`).not.toContain('Department of David Purvis');
      }
    }
    void page;
  });

  test('with a case file and a novelty theme in the same tab, the résumé is still ordinary', async ({
    page,
  }) => {
    await seedStorage(page, {
      session: { caseFile: { departments: ['intake', 'cube'], issuedNotices: [], released: true } },
      prefs: { theme: 'comic' },
    });
    await page.goto('resume/');
    await expect(page).toHaveTitle(/^David Purvis/);
    await expect(page.locator('.site-header, [data-status], [data-notice-slot]')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-theme', /.*/);
    const body = await page.locator('body').innerText();
    for (const s of STRINGS) expect(body).not.toContain(s);
  });
});
