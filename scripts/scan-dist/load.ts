/**
 * Loads a built site for the scanner: every file's text, each HTML page parsed with parse5, and
 * the build's chunk graph (reports/chunk-graph.json). makeSite() is pure (files in, Site out) so
 * each policy can be unit-tested on small in-memory fixtures.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { gzipSync } from 'node:zlib';
import { parse } from 'parse5';

export interface El {
  tag: string;
  attrs: Record<string, string>;
  /** Text inside the element (scripts, styles: their source). */
  text: string;
}

export interface Page {
  /** Path inside dist, e.g. 'resume/index.html'. */
  file: string;
  /** Route relative to the base: '' (home), 'resume/', '404.html'. */
  route: string;
  kind: 'page' | '404' | 'og-card' | 'engine';
  html: string;
  elements: El[];
  /** Visible text of <main> (or <body> when there is no main). */
  mainText: string;
  csp: string | null;
  /** Inline <script> elements that execute (JSON-LD excluded). */
  inlineScripts: El[];
  /** Module script srcs, as dist paths ('_assets/x.js'); null when off-site. */
  moduleScripts: (string | null)[];
}

export interface Chunk {
  fileName: string;
  isEntry: boolean;
  isDynamicEntry: boolean;
  imports: string[];
  dynamicImports: string[];
  modules: string[];
}

export interface Site {
  base: string;
  siteOrigin: string;
  /** dist-relative path → contents. */
  files: Record<string, string>;
  pages: Page[];
  graph: Record<string, Chunk> | null;
}

interface P5Node {
  nodeName: string;
  tagName?: string;
  value?: string;
  attrs?: { name: string; value: string }[];
  childNodes?: P5Node[];
  content?: P5Node;
}

const BLOCK = new Set([
  'p',
  'li',
  'dt',
  'dd',
  'div',
  'section',
  'article',
  'header',
  'footer',
  'nav',
  'ul',
  'ol',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'tr',
  'table',
  'main',
  'aside',
  'br',
]);

/** Visible text, one line per block element (the integrity rules are line-aware). */
function textOf(n: P5Node, skip = new Set(['script', 'style', 'template', 'noscript'])): string {
  if (n.nodeName === '#text') return n.value ?? '';
  if (n.tagName && skip.has(n.tagName)) return '';
  const inner = (n.childNodes ?? []).map((c) => textOf(c, skip)).join('');
  return n.tagName && BLOCK.has(n.tagName) ? `\n${inner}\n` : inner;
}

function walk(n: P5Node, out: El[]): void {
  if (n.tagName) {
    out.push({
      tag: n.tagName,
      attrs: Object.fromEntries((n.attrs ?? []).map((a) => [a.name, a.value])),
      text:
        n.tagName === 'script' || n.tagName === 'style'
          ? (n.childNodes ?? []).map((c) => c.value ?? '').join('')
          : '',
    });
  }
  for (const c of n.childNodes ?? []) walk(c, out);
  if (n.content) walk(n.content, out);
}

function find(n: P5Node, tag: string): P5Node | null {
  if (n.tagName === tag) return n;
  for (const c of n.childNodes ?? []) {
    const f = find(c, tag);
    if (f) return f;
  }
  return null;
}

/** Map a reference in a page to a dist path (null when it leaves the site). */
export function toDistPath(site: Pick<Site, 'base'>, ref: string, fromFile: string): string | null {
  if (/^(https?:)?\/\//i.test(ref) || /^(data|mailto|tel|blob|javascript):/i.test(ref)) return null;
  const clean = ref.split(/[?#]/)[0] ?? '';
  if (clean.startsWith('/')) {
    if (!clean.startsWith(`${site.base}/`)) return `__outside_base__${clean}`;
    return clean.slice(site.base.length + 1);
  }
  const dir = fromFile.includes('/') ? fromFile.slice(0, fromFile.lastIndexOf('/') + 1) : '';
  const parts = `${dir}${clean}`.split('/');
  const out: string[] = [];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p !== '.') out.push(p);
  }
  return out.join('/');
}

function routeOf(file: string): { route: string; kind: Page['kind'] } {
  if (file.startsWith('doom-engine/')) return { route: file, kind: 'engine' };
  if (file === '404.html') return { route: '404.html', kind: '404' };
  const route = file.replace(/index\.html$/, '');
  return { route, kind: route === 'og-card/' ? 'og-card' : 'page' };
}

export function makeSite(
  files: Record<string, string>,
  opts: { base: string; siteOrigin: string; graph?: Record<string, Chunk> | null },
): Site {
  const site: Site = {
    base: opts.base,
    siteOrigin: opts.siteOrigin,
    files,
    pages: [],
    graph: opts.graph ?? null,
  };
  for (const [file, html] of Object.entries(files)) {
    if (!file.endsWith('.html')) continue;
    const doc = parse(html) as unknown as P5Node;
    const elements: El[] = [];
    walk(doc, elements);
    const main = find(doc, 'main') ?? find(doc, 'body');
    const { route, kind } = routeOf(file);
    site.pages.push({
      file,
      route,
      kind,
      html,
      elements,
      mainText: main
        ? textOf(main)
            .split('\n')
            .map((l) => l.replace(/\s+/g, ' ').trim())
            .filter(Boolean)
            .join('\n')
        : '',
      csp:
        elements.find(
          (e) =>
            e.tag === 'meta' && e.attrs['http-equiv']?.toLowerCase() === 'content-security-policy',
        )?.attrs.content ?? null,
      inlineScripts: elements.filter(
        (e) => e.tag === 'script' && !('src' in e.attrs) && e.attrs.type !== 'application/ld+json',
      ),
      moduleScripts: elements
        .filter((e) => e.tag === 'script' && e.attrs.type === 'module' && e.attrs.src)
        .map((e) => toDistPath(site, e.attrs.src ?? '', file)),
    });
  }
  site.pages.sort((a, b) => a.file.localeCompare(b.file));
  return site;
}

const TEXT = /\.(html|js|css|md|txt|xml|json|svg|webmanifest)$/;

export function loadSite(
  dir: string,
  opts: { base: string; siteOrigin: string; graphFile: string },
): Site {
  const files: Record<string, string> = {};
  const list = (d: string): string[] =>
    readdirSync(d).flatMap((n) => {
      const p = join(d, n);
      return statSync(p).isDirectory() ? list(p) : [p];
    });
  for (const p of list(dir)) {
    const rel = relative(dir, p).replace(/\\/g, '/');
    files[rel] = TEXT.test(rel) ? readFileSync(p, 'utf8') : '';
  }
  const graph = existsSync(opts.graphFile)
    ? (JSON.parse(readFileSync(opts.graphFile, 'utf8')) as { chunks: Record<string, Chunk> }).chunks
    : null;
  return makeSite(files, { base: opts.base, siteOrigin: opts.siteOrigin, graph });
}

export const gz = (s: string): number => gzipSync(s, { level: 9 }).length;
export const kb = (n: number): string => (n / 1024).toFixed(1);

/** A page's static JS closure: its module entries plus everything they statically import. */
export function staticClosure(site: Site, entries: readonly (string | null)[]): Set<string> {
  const seen = new Set<string>();
  const visit = (f: string) => {
    if (seen.has(f)) return;
    seen.add(f);
    for (const i of site.graph?.[f]?.imports ?? []) visit(i);
  };
  for (const e of entries) if (e) visit(e);
  return seen;
}
