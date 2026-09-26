/**
 * Post-build scan of dist/ (plan §12.3). Fails the build on anything that would make the site's
 * promises untrue: malware-flavoured copy, CAPTCHA-vendor lookalikes, third-party loads, a CSP
 * hash that doesn't match the one inline script, style attributes, missing meta, blown JS budgets,
 * test hooks leaking into production, or Form DRV-7 (which does not exist).
 */
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = resolve(process.argv[2] ?? 'dist');
const BASE = (
  process.env.BASE_PATH || '/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World'
).replace(/\/$/, '');
const SITE = new URL(process.env.SITE_URL || 'https://davidpurvis.github.io').origin;
const TEST_BUILD = process.env.PUBLIC_TEST_HOOKS === '1';

/**
 * Route (relative to dist, directory style) → max gzipped JS in KB, counting each page's module
 * scripts plus their static imports (lazy chunks excluded). The shared chaos layer measures
 * ~11.6 KB (storage validation, mode, threat, runaway exits, rickroll dialog, global copy), so gag
 * pages get 14 KB; the résumé page stays nearly JS-free.
 */
const JS_BUDGET_KB: Record<string, number> = {
  '': 22,
  'verify/': 20,
  'legal/': 16,
  'support/': 15,
  'casino/': 20,
  'contact/': 16,
  'resume/': 3,
  'og-card/': 0,
};
const DEFAULT_JS_BUDGET_KB = 14;
const CSS_BUDGET_KB = 20;
const LAZY_CHUNK_BUDGET_KB = 35;

const FORBIDDEN: [RegExp, string][] = [
  [/verify you are human/i, 'real-CAPTCHA phrasing'],
  [/\bwin\s*\+\s*r\b/i, 'Run-box instruction'],
  [/\bctrl\s*\+\s*v\b/i, 'paste instruction'],
  [/navigator\.clipboard/, 'clipboard access'],
  [/execCommand\(\s*['"]copy/, 'clipboard access'],
  [/\.exe\b/i, 'executable reference'],
  [/g-recaptcha|recaptcha|turnstile|cf-challenge|hcaptcha/i, 'CAPTCHA vendor lookalike'],
  [/DRV-7\b/, 'Form DRV-7 does not exist'],
  [/\[(EMAIL|PHONE|USERNAME)\]/, 'unfilled placeholder'],
];
/** Test hooks must never ship. */
const PROD_ONLY: [RegExp, string][] = [[/__uvcr/, 'test hook in production build']];

const problems: string[] = [];
const fail = (file: string, msg: string) => problems.push(`${relative(DIST, file) || '.'}: ${msg}`);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const gz = (buf: Buffer | string) => gzipSync(buf, { level: 9 }).length;
const kb = (n: number) => (n / 1024).toFixed(1);

/** Map a site URL (with base) to a file in dist, or null if it is off-site. */
function toDistPath(ref: string, fromFile: string): string | null {
  if (/^(https?:)?\/\//i.test(ref) || /^(data|mailto|tel|blob|javascript):/i.test(ref)) return null;
  const clean = ref.split(/[?#]/)[0] ?? '';
  if (clean.startsWith('/')) {
    if (!clean.startsWith(`${BASE}/`)) return join(DIST, '__outside_base__', clean);
    return join(DIST, clean.slice(BASE.length + 1));
  }
  return resolve(dirname(fromFile), clean);
}

/** Static import graph of an emitted ES module (dynamic import() is deliberately not followed). */
function staticClosure(entry: string, seen = new Set<string>()): Set<string> {
  if (seen.has(entry) || !existsSync(entry)) return seen;
  seen.add(entry);
  const src = readFileSync(entry, 'utf8');
  const re = /(?:^|[;}\s])import\s*(?:[\w${},*\s]+from\s*)?["']([^"']+)["']/g;
  for (const m of src.matchAll(re)) {
    const spec = m[1] ?? '';
    if (spec.startsWith('.')) staticClosure(resolve(dirname(entry), spec), seen);
  }
  return seen;
}

const files = walk(DIST);
const htmlFiles = files.filter((f) => f.endsWith('.html'));
const jsFiles = files.filter((f) => f.endsWith('.js'));
const cssFiles = files.filter((f) => f.endsWith('.css'));
const staticallyReachable = new Set<string>();
const rows: [string, string, string][] = [];

/* ---------- text scans ---------- */
for (const f of [...htmlFiles, ...jsFiles, ...files.filter((f) => /\.(md|txt)$/.test(f))]) {
  const text = readFileSync(f, 'utf8');
  for (const [re, why] of FORBIDDEN) if (re.test(text)) fail(f, `forbidden pattern ${re} (${why})`);
  if (!TEST_BUILD) for (const [re, why] of PROD_ONLY) if (re.test(text)) fail(f, why);
}

/* ---------- third-party references in JS and CSS ---------- */
for (const f of jsFiles) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/https?:\/\/[^\s"'`)<>]+/g)) {
    const u = m[0];
    // Only the click-to-play YouTube embed, this site's own origin (console links; the dev
    // fallback in absoluteUrl), and plain link targets rendered as <a href>.
    const allowed =
      u.startsWith(SITE) ||
      u === 'http://localhost' ||
      u.startsWith('https://www.youtube-nocookie.com/embed/') ||
      u.startsWith('https://www.youtube.com/watch') ||
      u.startsWith('https://github.com/DavidPurvis') ||
      u.startsWith('https://www.linkedin.com/in/dgp0') ||
      u.startsWith('http://www.w3.org/') ||
      u.startsWith('https://tosdr.org');
    if (!allowed) fail(f, `unexpected external URL in script: ${u}`);
  }
}
for (const f of cssFiles) {
  const text = readFileSync(f, 'utf8');
  for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
    const ref = m[1] ?? '';
    if (/^(https?:)?\/\//.test(ref)) fail(f, `external url() in CSS: ${ref}`);
    else if (!ref.startsWith('data:') && !ref.startsWith('#')) {
      const p = toDistPath(ref, f);
      if (p && !existsSync(p)) fail(f, `broken url() in CSS: ${ref}`);
    }
  }
  if (gz(readFileSync(f)) > CSS_BUDGET_KB * 1024) fail(f, `CSS over ${CSS_BUDGET_KB} KB gz`);
}

/* ---------- per-page HTML checks ---------- */
for (const f of htmlFiles) {
  const html = readFileSync(f, 'utf8');
  const route = relative(DIST, dirname(f)).replace(/\\/g, '/');
  const is404 = f.endsWith('404.html');
  const routeKey = is404 ? '404.html' : route ? `${route}/` : '';
  const isOgCard = routeKey === 'og-card/';

  if (!/<html[^>]*\slang="[a-z]{2}/.test(html)) fail(f, 'missing <html lang>');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(f, 'missing <title>');
  if (/\sstyle="/.test(html)) fail(f, 'inline style attribute (breaks style-src CSP)');

  if (!isOgCard) {
    for (const [re, what] of [
      [/<meta name="description" content="[^"]{20,}"/, 'description'],
      [/<link rel="canonical" href="https?:\/\/[^"]+"/, 'canonical'],
      [/<meta property="og:image" content="https?:\/\/[^"]+\.png"/, 'og:image'],
      [/<meta property="og:title" content="[^"]+"/, 'og:title'],
      [/<meta name="viewport"/, 'viewport'],
    ] as const) {
      if (!re.test(html)) fail(f, `missing ${what}`);
    }
    if (!is404 && (html.match(/<h1[\s>]/g) ?? []).length !== 1)
      fail(f, 'expected exactly one <h1>');

    // Exactly one executable inline script, pinned by hash in the CSP meta.
    const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)].filter(
      (m) => !/type="application\/ld\+json"/.test(m[1] ?? ''),
    );
    const csp = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1];
    if (!csp) fail(f, 'missing CSP meta');
    if (inline.length !== 1) fail(f, `expected 1 inline script, found ${inline.length}`);
    else if (csp) {
      const hash = createHash('sha256')
        .update(inline[0]?.[2] ?? '')
        .digest('base64');
      if (!csp.includes(`'sha256-${hash}'`)) fail(f, 'inline script hash not in CSP');
    }
    if (csp && /'unsafe-inline'|'unsafe-eval'/.test(csp)) fail(f, 'CSP allows unsafe-*');
  }

  // Off-origin loads: scripts, stylesheets, images, iframes, preloads.
  for (const m of html.matchAll(/<(script|img|iframe|source|link)\b[^>]*>/g)) {
    const tag = m[0];
    if (/<link\b/.test(tag) && /rel="(canonical|alternate)"/.test(tag)) continue;
    const ref = tag.match(/\s(?:src|href)="([^"]+)"/)?.[1];
    if (!ref) continue;
    if (/^(https?:)?\/\//.test(ref)) fail(f, `third-party load: ${tag.slice(0, 120)}`);
    else {
      const p = toDistPath(ref, f);
      if (p && !existsSync(p) && !existsSync(join(p, 'index.html')))
        fail(f, `broken asset reference: ${ref}`);
    }
  }
  for (const m of html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)) {
    if (!/rel="[^"]*noopener/.test(m[0])) fail(f, `target=_blank without noopener: ${m[0]}`);
  }

  // JS budget: every module script plus its static imports.
  const entries = [...html.matchAll(/<script[^>]*type="module"[^>]*src="([^"]+)"/g)]
    .map((m) => toDistPath(m[1] ?? '', f))
    .filter((p): p is string => !!p);
  const closure = new Set<string>();
  for (const e of entries) for (const p of staticClosure(e)) closure.add(p);
  for (const p of closure) staticallyReachable.add(p);
  const total = [...closure].reduce((n, p) => n + gz(readFileSync(p)), 0);
  const budget = JS_BUDGET_KB[routeKey] ?? DEFAULT_JS_BUDGET_KB;
  rows.push([`/${routeKey}`, kb(total), String(budget)]);
  if (total > budget * 1024) fail(f, `JS ${kb(total)} KB gz over budget ${budget} KB`);
}

/* ---------- lazy chunks (matter-js) must stay lazy and bounded ---------- */
for (const f of jsFiles) {
  const src = readFileSync(f, 'utf8');
  if (
    /matter-js|Matter\.Engine|MouseConstraint/.test(src) &&
    /Engine\.create|Composite\.add/.test(src)
  ) {
    if (staticallyReachable.has(f)) fail(f, 'physics engine is statically reachable from a page');
    if (gz(src) > LAZY_CHUNK_BUDGET_KB * 1024)
      fail(f, `lazy chunk over ${LAZY_CHUNK_BUDGET_KB} KB gz`);
  }
}

/* ---------- report ---------- */
const w = Math.max(...rows.map((r) => r[0].length), 5);
console.log(`${'route'.padEnd(w)}  JS gz KB  budget`);
for (const [r, s, b] of rows.sort())
  console.log(`${r.padEnd(w)}  ${s.padStart(8)}  ${b.padStart(6)}`);
if (problems.length) {
  console.error(`\n✗ scan-dist found ${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log(
  `\n✓ scan-dist: ${htmlFiles.length} pages, ${jsFiles.length} scripts, ${cssFiles.length} stylesheets clean.`,
);
