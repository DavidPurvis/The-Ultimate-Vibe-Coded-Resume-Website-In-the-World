/**
 * Production policies over the built site. Each is a pure function of the Site and names the plan
 * invariant it enforces. HTML is read through parse5 (no attribute-order or quoting assumptions);
 * JS budgets and the résumé boundary come from the build's chunk graph.
 */
import { createHash } from 'node:crypto';
import { buildCsp, ENGINE_CSP } from '../../src/lib/csp';
import { ROUTES } from '../../src/content/site/meta';
import { departmentStrings } from '../../src/content/department/strings';
import { checkResumeText, formatViolations } from '../../src/lib/integrity';
import {
  CSS_BUDGET_KB,
  DEFAULT_JS_BUDGET_KB,
  HEAVY_CHUNK_KB,
  JS_BUDGET_KB,
  LAZY_CHUNK_BUDGET_KB,
} from './budgets';
import { gz, kb, staticClosure, toDistPath, type Page, type Site } from './load';

export interface Problem {
  policy: string;
  file: string;
  message: string;
}
export type Policy = (site: Site) => Problem[];

const isEngine = (f: string) => f.startsWith('doom-engine/');
const appJs = (site: Site) =>
  Object.keys(site.files).filter((f) => f.endsWith('.js') && !isEngine(f));
const isResume = (p: Page) => p.route === 'resume/' || p.route.startsWith('resume/for/');
const sha256 = (s: string) => createHash('sha256').update(s).digest('base64');

/** Every page carries the metadata a shared link needs, and one <h1>. */
const htmlBasics: Policy = (site) => {
  const out: Problem[] = [];
  for (const p of site.pages) {
    const fail = (m: string) => out.push({ policy: 'html.basics', file: p.file, message: m });
    const html = p.elements.find((e) => e.tag === 'html');
    if (!/^[a-z]{2}/.test(html?.attrs.lang ?? '')) fail('missing <html lang>');
    if (!p.elements.find((e) => e.tag === 'title')) fail('missing <title>');
    if (p.kind === 'og-card' || p.kind === 'engine') continue;
    const meta = (k: string, v: string) =>
      p.elements.find((e) => e.tag === 'meta' && e.attrs[k] === v)?.attrs.content ?? '';
    if (meta('name', 'description').length < 20) fail('missing description');
    if (meta('name', 'viewport') === '') fail('missing viewport');
    if (!/^https?:\/\/.+\.png$/.test(meta('property', 'og:image'))) fail('missing og:image');
    if (meta('property', 'og:title') === '') fail('missing og:title');
    const canonical = p.elements.find((e) => e.tag === 'link' && e.attrs.rel === 'canonical');
    if (!/^https?:\/\//.test(canonical?.attrs.href ?? '')) fail('missing canonical');
    if (p.kind !== '404' && p.elements.filter((e) => e.tag === 'h1').length !== 1)
      fail('expected exactly one <h1>');
  }
  return out;
};

/** S2: no style attributes (they would need 'unsafe-inline'). */
const styleAttr: Policy = (site) =>
  site.pages.flatMap((p) =>
    p.elements
      .filter((e) => 'style' in e.attrs)
      .map((e) => ({
        policy: 'html.styleAttr',
        file: p.file,
        message: `style attribute on <${e.tag}>`,
      })),
  );

/** S1: every page's CSP is exactly buildCsp(hash of its one inline script); the engine's is ENGINE_CSP. */
const csp: Policy = (site) => {
  const out: Problem[] = [];
  for (const p of site.pages) {
    const fail = (m: string) => out.push({ policy: 'csp', file: p.file, message: m });
    if (p.kind === 'engine') {
      if (p.csp !== ENGINE_CSP) fail('engine CSP differs from ENGINE_CSP');
      if (p.inlineScripts.length) fail('inline script in the engine frame');
      continue;
    }
    if (p.kind === 'og-card') continue;
    if (!p.csp) {
      fail('missing CSP meta');
      continue;
    }
    if (p.inlineScripts.length !== 1) {
      fail(`expected 1 inline script, found ${p.inlineScripts.length}`);
      continue;
    }
    if (p.csp !== buildCsp(sha256(p.inlineScripts[0]?.text ?? '')))
      fail('CSP differs from buildCsp(hash of the inline script)');
  }
  return out;
};

const FORBIDDEN_TEXT: [RegExp, string][] = [
  [/verify you are human/i, 'real-CAPTCHA phrasing'],
  [/\bwin\s*\+\s*r\b/i, 'Run-box instruction'],
  [/\bctrl\s*\+\s*v\b/i, 'paste instruction'],
  [/execCommand\(\s*['"]copy/, 'clipboard access'],
  [/\.exe\b/i, 'executable reference'],
  [/g-recaptcha|recaptcha|turnstile|cf-challenge|hcaptcha/i, 'CAPTCHA vendor lookalike'],
  [/DRV-\d*7\d*\b/, 'form numbers never contain a 7'],
  [/\[(EMAIL|PHONE|USERNAME)\]/, 'unfilled placeholder'],
];

/** S4: no scam-flow phrasing or placeholders in anything served. */
const forbiddenText: Policy = (site) =>
  Object.entries(site.files)
    .filter(([f]) => /\.(html|js|md|txt|xml)$/.test(f))
    .flatMap(([f, text]) =>
      FORBIDDEN_TEXT.filter(([re]) => re.test(text)).map(([re, why]) => ({
        policy: 'text.forbidden',
        file: f,
        message: `${why}: ${re}`,
      })),
    );

const SENSITIVE_AUTOFILL =
  /^(cc-[a-z-]+|bday[a-z-]*|street-address|postal-code|tel[a-z-]*|email|current-password|new-password|one-time-code)$/i;

/** S4: no forms, no credential or contact inputs, no sensitive autofill. */
const formsAndInputs: Policy = (site) =>
  site.pages.flatMap((p) =>
    p.elements.flatMap((e) => {
      const out: string[] = [];
      if (e.tag === 'form') out.push('<form> element');
      if (e.tag === 'input' && /^(password|email|tel)$/i.test(e.attrs.type ?? ''))
        out.push(`input type=${e.attrs.type}`);
      if (SENSITIVE_AUTOFILL.test(e.attrs.autocomplete ?? ''))
        out.push(`autocomplete=${e.attrs.autocomplete}`);
      return out.map((m) => ({ policy: 'html.forms', file: p.file, message: m }));
    }),
  );

const APP_JS_FORBIDDEN: [RegExp, string][] = [
  [/__uvcr|PUBLIC_TEST_HOOKS/, 'test hook'],
  [/\bNotification\b|geolocation|getUserMedia|permissions\.query/, 'permission prompt API'],
  [/sendBeacon|XMLHttpRequest|\bWebSocket\b|\bEventSource\b/, 'transmit API'],
  [/hardwareConcurrency|deviceMemory/, 'fingerprinting API'],
  [/clipboardData|navigator\.clipboard/, 'clipboard access'],
  [/Math\.random\(/, 'unseeded randomness'],
];

/** P4, P5, D2: app code cannot transmit, prompt, fingerprint, read the clipboard or roll dice. */
const appApis: Policy = (site) =>
  appJs(site).flatMap((f) =>
    APP_JS_FORBIDDEN.filter(([re]) => re.test(site.files[f] ?? '')).map(([re, why]) => ({
      policy: 'js.appApis',
      file: f,
      message: `${why}: ${re}`,
    })),
  );

/** Defence in depth behind the CSP: scripts mention no other origin except plain link targets. */
const externalUrls: Policy = (site) =>
  Object.keys(site.files)
    .filter((f) => f.endsWith('.js'))
    .flatMap((f) =>
      [...(site.files[f] ?? '').matchAll(/https?:\/\/[^\s"'`)<>]+/g)]
        .map((m) => m[0])
        .filter(
          (u) =>
            !(
              u.startsWith(site.siteOrigin) ||
              u === 'http://localhost' ||
              u.startsWith('https://github.com/DavidPurvis') ||
              u.startsWith('https://www.linkedin.com/in/dgp0') ||
              u.startsWith('http://www.w3.org/') ||
              // Part of an Emscripten error message in the vendored DOOM engine; never fetched.
              u === 'https://github.com/emscripten-core/emscripten/wiki/Linking'
            ),
        )
        .map((u) => ({ policy: 'js.externalUrls', file: f, message: `unexpected URL ${u}` })),
    );

/** Stylesheets load nothing from elsewhere, reference only real files, and stay small. */
const css: Policy = (site) =>
  Object.keys(site.files)
    .filter((f) => f.endsWith('.css'))
    .flatMap((f) => {
      const text = site.files[f] ?? '';
      const out: string[] = [];
      for (const m of text.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) {
        const ref = m[1] ?? '';
        if (/^(https?:)?\/\//.test(ref)) out.push(`external url(): ${ref}`);
        else if (!ref.startsWith('data:') && !ref.startsWith('#')) {
          const p = toDistPath(site, ref, f);
          if (p && !(p in site.files)) out.push(`broken url(): ${ref}`);
        }
      }
      if (gz(text) > CSS_BUDGET_KB * 1024) out.push(`over ${CSS_BUDGET_KB} KB gz`);
      return out.map((message) => ({ policy: 'css', file: f, message }));
    });

/** S2, P1: nothing loads from another origin; every reference resolves; new tabs get noopener. */
const references: Policy = (site) => {
  const out: Problem[] = [];
  for (const p of site.pages) {
    const fail = (m: string) => out.push({ policy: 'html.references', file: p.file, message: m });
    for (const e of p.elements) {
      if (!['script', 'img', 'iframe', 'source', 'link'].includes(e.tag)) continue;
      if (e.tag === 'link' && /^(canonical|alternate)$/.test(e.attrs.rel ?? '')) continue;
      const ref = e.attrs.src ?? e.attrs.href;
      if (!ref) continue;
      if (/^(https?:)?\/\//.test(ref)) fail(`third-party <${e.tag}>: ${ref}`);
      else {
        const d = toDistPath(site, ref, p.file);
        if (
          d !== null &&
          !(d in site.files) &&
          !(`${d.replace(/\/?$/, '/')}index.html` in site.files)
        )
          fail(`broken reference: ${ref}`);
      }
    }
    for (const a of p.elements.filter((e) => e.tag === 'a' && e.attrs.target === '_blank'))
      if (!/\bnoopener\b/.test(a.attrs.rel ?? ''))
        fail(`target=_blank without noopener: ${a.attrs.href}`);
  }
  return out;
};

/** The build's chunk graph exists and knows every script the site ships. */
const graphPresent: Policy = (site) => {
  if (!site.graph)
    return [{ policy: 'graph', file: 'reports/chunk-graph.json', message: 'chunk graph missing' }];
  return appJs(site)
    .filter((f) => f.startsWith('_assets/') && !(f in (site.graph ?? {})))
    .map((f) => ({ policy: 'graph', file: f, message: 'not in the chunk graph' }));
};

/** Pf1, Pf2: per-route JS budgets over each page's static closure; lazy chunks small; no heavy chunk static. */
export function budgetRows(site: Site): [string, number, number][] {
  return site.pages
    .filter((p) => p.kind !== 'engine')
    .map((p) => {
      const closure = staticClosure(site, p.moduleScripts);
      const total = [...closure].reduce((n, f) => n + gz(site.files[f] ?? ''), 0);
      return [`/${p.route}`, total, (JS_BUDGET_KB[p.route] ?? DEFAULT_JS_BUDGET_KB) * 1024];
    });
}
const budgets: Policy = (site) => {
  const out: Problem[] = [];
  for (const [route, total, budget] of budgetRows(site))
    if (total > budget)
      out.push({
        policy: 'budgets.js',
        file: route,
        message: `${kb(total)} KB gz over ${kb(budget)} KB`,
      });
  const reachable = new Set(site.pages.flatMap((p) => [...staticClosure(site, p.moduleScripts)]));
  for (const f of appJs(site)) {
    const size = gz(site.files[f] ?? '');
    if (!reachable.has(f) && size > LAZY_CHUNK_BUDGET_KB * 1024)
      out.push({
        policy: 'budgets.lazy',
        file: f,
        message: `lazy chunk ${kb(size)} KB gz over ${LAZY_CHUNK_BUDGET_KB} KB`,
      });
    if (reachable.has(f) && size > HEAVY_CHUNK_KB * 1024)
      out.push({
        policy: 'budgets.heavy',
        file: f,
        message: `${kb(size)} KB gz chunk in a page's static closure`,
      });
  }
  return out;
};

/** The pages built are exactly the route table (plus the 404, the OG card and DOOM's frame). */
const routeCoverage: Policy = (site) => {
  const expected = new Set(
    Object.values(ROUTES).map((r) => (r.path === '/404.html' ? '404.html' : r.path.slice(1))),
  );
  expected.add('og-card/');
  const built = new Set(site.pages.filter((p) => p.kind !== 'engine').map((p) => p.route));
  return [
    ...[...expected].filter((r) => !built.has(r)).map((r) => `route missing from the build: /${r}`),
    ...[...built].filter((r) => !expected.has(r)).map((r) => `page not in the route table: /${r}`),
  ].map((message) => ({ policy: 'routes.coverage', file: '.', message }));
};

/** The résumé loads nothing of the Department, stores nothing, and says nothing departmental. */
const resumeBoundary: Policy = (site) => {
  const out: Problem[] = [];
  const strings = departmentStrings();
  const FORBIDDEN_MODULE =
    /^src\/(scenes|case|domain|content\/(department|copy))\/|^src\/runtime\/(?!lifecycle\.ts$)|^src\/lib\/(scene|mode|storage)\.ts$/;
  for (const p of site.pages.filter(isResume)) {
    const fail = (m: string) => out.push({ policy: 'boundary.resume', file: p.file, message: m });
    const closure = staticClosure(site, p.moduleScripts);
    for (const f of closure) {
      for (const m of site.graph?.[f]?.modules ?? [])
        if (FORBIDDEN_MODULE.test(m)) fail(`loads ${m} (via ${f})`);
      if ((site.files[f] ?? '').includes('uvcr:case')) fail(`${f} mentions the case record`);
    }
    if (p.html.includes('uvcr:case')) fail('the page mentions the case record');
    for (const s of strings) if (p.html.includes(s)) fail(`departmental copy: "${s.slice(0, 50)}"`);
  }
  for (const f of ['resume.md', 'llms.txt'])
    for (const s of strings)
      if ((site.files[f] ?? '').includes(s))
        out.push({
          policy: 'boundary.resume',
          file: f,
          message: `departmental copy: "${s.slice(0, 50)}"`,
        });
  return out;
};

/** F3: the integrity rules (R1–R12) over the built résumé pages, resume.md and llms.txt. */
const contentIntegrity: Policy = (site) => {
  const out: Problem[] = [];
  const check = (file: string, text: string, scope: 'resume' | 'md' | 'llms') => {
    const v = checkResumeText(text, scope);
    if (v.length)
      out.push({ policy: 'content.integrity', file, message: `\n${formatViolations(v)}` });
  };
  for (const p of site.pages.filter(isResume)) check(p.file, p.mainText, 'resume');
  if ('resume.md' in site.files) check('resume.md', site.files['resume.md'] ?? '', 'md');
  if ('llms.txt' in site.files) check('llms.txt', site.files['llms.txt'] ?? '', 'llms');
  return out;
};

export const POLICIES: Readonly<Record<string, Policy>> = {
  'html.basics': htmlBasics,
  'html.styleAttr': styleAttr,
  csp,
  'text.forbidden': forbiddenText,
  'html.forms': formsAndInputs,
  'js.appApis': appApis,
  'js.externalUrls': externalUrls,
  css,
  'html.references': references,
  graph: graphPresent,
  budgets,
  'routes.coverage': routeCoverage,
  'boundary.resume': resumeBoundary,
  'content.integrity': contentIntegrity,
};

export function runPolicies(site: Site): Problem[] {
  return Object.values(POLICIES).flatMap((p) => p(site));
}
