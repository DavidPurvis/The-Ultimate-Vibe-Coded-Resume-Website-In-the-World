import { expect, test } from '@playwright/test';
import { BASE, HTML_ROUTES } from './helpers';
import { ROUTES, DECOYS } from '../../src/content/copy/meta';

test.describe('routes', () => {
  test('the route list covers every page in the site map', () => {
    const fromMeta = Object.values(ROUTES)
      .map((r) => r.path)
      .filter((p) => p !== '/404.html')
      .concat(DECOYS.map((d) => `/r/${d.slug}/`))
      .map((p) => p.slice(1))
      .sort();
    expect([...HTML_ROUTES].sort()).toEqual(fromMeta);
  });

  test('every page has complete metadata and exactly one h1 @smoke', async ({ request }) => {
    for (const r of HTML_ROUTES) {
      const res = await request.get(r);
      expect(res.status(), r).toBe(200);
      const html = await res.text();
      expect(html, r).toMatch(/<html lang="en"/);
      expect(html, r).toMatch(/<title>[^<]{5,}<\/title>/);
      expect(html, r).toMatch(/<meta name="description" content="[^"]{20,}"/);
      expect(html, r).toMatch(/<link rel="canonical" href="https:\/\/[^"]+"/);
      expect(html, r).toMatch(/<meta property="og:image" content="https:\/\/[^"]+og\.png"/);
      expect(html, r).toMatch(/<meta name="twitter:card" content="summary_large_image"/);
      expect((html.match(/<h1[\s>]/g) ?? []).length, r).toBe(1);
    }
  });

  test('crawl: every same-origin link and asset on every page resolves', async ({ request }) => {
    const seen = new Set<string>();
    const broken: string[] = [];
    for (const r of HTML_ROUTES) {
      const html = await (await request.get(r)).text();
      const refs = [...html.matchAll(/\s(?:href|src)="([^"#][^"]*)"/g)].map((m) => m[1] ?? '');
      for (const ref of refs) {
        if (!ref.startsWith(`${BASE}/`)) continue; // external or mailto: checked elsewhere
        const path = ref.split('#')[0] ?? '';
        if (seen.has(path)) continue;
        seen.add(path);
        const res = await request.get(`http://127.0.0.1:4321${path}`);
        if (res.status() !== 200) broken.push(`${r} → ${path} (${res.status()})`);
      }
    }
    expect(broken).toEqual([]);
    expect(seen.size).toBeGreaterThan(40);
  });

  test('machine-readable files are served with the right types', async ({ request }) => {
    const types: [string, RegExp][] = [
      ['resume.pdf', /application\/pdf/],
      ['resume.md', /text\/markdown/],
      ['llms.txt', /text\/plain/],
      ['robots.txt', /text\/plain/],
      ['og.png', /image\/png/],
    ];
    for (const [p, t] of types) {
      const res = await request.get(p);
      expect(res.status(), p).toBe(200);
      expect(res.headers()['content-type'], p).toMatch(t);
    }
  });

  test('no page mimics a real CAPTCHA or system prompt', async ({ request }) => {
    for (const r of HTML_ROUTES) {
      const html = await (await request.get(r)).text();
      expect(html, r).not.toMatch(
        /verify you are human|recaptcha|turnstile|hcaptcha|win\s*\+\s*r/i,
      );
      expect(html, r).not.toMatch(/<input[^>]+type="(checkbox|password)"/);
      expect(html, r).not.toMatch(/DRV-7\b/);
    }
  });
});
