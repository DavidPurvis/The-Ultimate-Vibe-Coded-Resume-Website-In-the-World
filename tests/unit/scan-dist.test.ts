/**
 * The production scanner (plan §S, P6), on small in-memory sites: a clean fixture passes every
 * policy, and each mutation fails the policy that guards it. The fixture is built from the real
 * route table, CSP builder, boot scripts and résumé renderers, so a drift between those and the
 * scanner shows up here before it shows up in CI.
 */
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { gz, makeSite, staticClosure, toDistPath, type Chunk } from '../../scripts/scan-dist/load';
import { budgetRows, POLICIES, runPolicies } from '../../scripts/scan-dist/policies';
import { BOOT_RESUME, BOOT_SITE } from '../../src/lib/boot';
import { buildCsp, ENGINE_CSP } from '../../src/lib/csp';
import { renderLlmsTxt } from '../../src/lib/machineText';
import { renderResumeMarkdown, renderResumeText } from '../../src/lib/resumeText';
import { LANES, type LaneId } from '../../src/content/resume/resolve';
import { ROUTES } from '../../src/content/site/meta';
import { departmentStrings } from '../../src/content/department/strings';

type Files = Record<string, string>;
type Graph = Record<string, Chunk>;

const BASE = '/site';
const ORIGIN = 'https://example.test';
const sha256 = (s: string) => createHash('sha256').update(s).digest('base64');
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');

const chunk = (fileName: string, o: Partial<Chunk> = {}): Chunk => ({
  fileName,
  isEntry: false,
  isDynamicEntry: false,
  imports: [],
  dynamicImports: [],
  modules: [],
  ...o,
});

/** Base64 of hashes: close to incompressible, so gzipped size ≈ ¾ of the length. */
function noise(length: number): string {
  let s = '';
  for (let i = 0; s.length < length; i++) s += sha256(String(i));
  return `export const n="${s}";`;
}

function page(route: string, o: { boot?: string; scripts?: string[]; body?: string } = {}) {
  const boot = o.boot ?? BOOT_SITE;
  const scripts = (o.scripts ?? [])
    .map((s) => `<script type="module" src="${BASE}/_assets/${s}"></script>`)
    .join('');
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${buildCsp(sha256(boot))}">
<title>A page</title>
<meta name="description" content="A page with a description long enough to share.">
<meta property="og:title" content="A page">
<meta property="og:image" content="${ORIGIN}${BASE}/og.png">
<link rel="canonical" href="${ORIGIN}${BASE}/${route}">
<link rel="stylesheet" href="${BASE}/_assets/site.css">
<script>${boot}</script>${scripts}
<script type="application/ld+json">{"@type":"Person"}</script>
</head><body><main><h1>A page</h1>${o.body ?? ''}</main></body></html>`;
}

const resumeBody = (lane: LaneId) =>
  renderResumeText(LANES[lane])
    .split('\n')
    .filter(Boolean)
    .map((l) => `<p>${esc(l)}</p>`)
    .join('\n');

const fileOf = (path: string) => (path === '/404.html' ? '404.html' : `${path.slice(1)}index.html`);

/** A small site that passes every policy. */
function fixture(): { files: Files; graph: Graph } {
  const graph: Graph = {
    '_assets/home.js': chunk('_assets/home.js', {
      isEntry: true,
      imports: ['_assets/lifecycle.js'],
      dynamicImports: ['_assets/ceremony.js'],
      modules: ['src/runtime/kernel.ts', 'src/scripts/home.ts'],
    }),
    '_assets/lifecycle.js': chunk('_assets/lifecycle.js', {
      modules: ['src/runtime/lifecycle.ts'],
    }),
    '_assets/ceremony.js': chunk('_assets/ceremony.js', {
      isDynamicEntry: true,
      modules: ['src/steps/ceremony.ts'],
    }),
    '_assets/print.js': chunk('_assets/print.js', {
      isEntry: true,
      imports: ['_assets/lifecycle.js'],
      modules: ['src/scripts/resume-page.ts'],
    }),
    '_assets/privacy.js': chunk('_assets/privacy.js', {
      isEntry: true,
      imports: ['_assets/lifecycle.js'],
      modules: ['src/scripts/privacy.ts'],
    }),
    '_assets/doom.js': chunk('_assets/doom.js', {
      isEntry: true,
      imports: ['_assets/lifecycle.js'],
      modules: ['src/scripts/doom-page.ts'],
    }),
  };
  const files: Files = {
    '_assets/site.css': 'body{background:url(paper.svg)}',
    '_assets/paper.svg': '<svg xmlns="http://www.w3.org/2000/svg"/>',
    'og-card/index.html':
      '<!doctype html><html lang="en"><head><title>Card</title></head><body></body></html>',
    'doom-engine/play.html': `<!doctype html><html lang="en"><head>
<meta http-equiv="Content-Security-Policy" content="${ENGINE_CSP}"><title>Engine</title>
<script src="play.js"></script></head><body></body></html>`,
    // The vendored engine is not app code: its own randomness and URLs are out of scope.
    'doom-engine/play.js':
      'Math.random();"https://github.com/emscripten-core/emscripten/wiki/Linking"',
    'resume.md': renderResumeMarkdown(`${BASE}/resume.pdf`),
    'llms.txt': renderLlmsTxt(`${ORIGIN}${BASE}/`),
  };
  for (const f of Object.keys(graph)) files[f] = `export const f=${JSON.stringify(f)};`;
  for (const { path } of Object.values(ROUTES)) {
    const route = path.slice(1);
    const lane = /^\/resume\/(?:for\/(emb|plt|be)\/)?$/.exec(path);
    files[fileOf(path)] = lane
      ? page(route, {
          boot: BOOT_RESUME,
          scripts: ['print.js'],
          body: resumeBody((lane[1] ?? 'gen') as LaneId),
        })
      : page(route, {
          scripts:
            path === '/'
              ? ['home.js']
              : path === '/privacy/'
                ? ['privacy.js']
                : path === '/doom/'
                  ? ['doom.js']
                  : [],
        });
  }
  return { files, graph };
}

function variant(edit: (files: Files, graph: Graph) => void) {
  const fx = fixture();
  edit(fx.files, fx.graph);
  return fx;
}

function append(files: Files, file: string, text: string): void {
  files[file] = `${files[file] ?? ''}${text}`;
}

/** Replace text in one fixture file, failing loudly if the anchor is gone. */
function patch(files: Files, file: string, from: string, to: string): void {
  const text = files[file];
  if (text === undefined || !text.includes(from)) throw new Error(`${file}: no "${from}"`);
  files[file] = text.replace(from, to);
}

const siteOf = (fx: { files: Files; graph: Graph | null }) =>
  makeSite(fx.files, { base: BASE, siteOrigin: ORIGIN, graph: fx.graph });

function problems(policy: string, fx: { files: Files; graph: Graph | null }): string[] {
  const run = POLICIES[policy];
  if (!run) throw new Error(`no policy ${policy}`);
  return run(siteOf(fx)).map((p) => `${p.file}: ${p.message}`);
}

describe('the clean fixture', () => {
  it('passes every policy', () => {
    expect(runPolicies(siteOf(fixture()))).toEqual([]);
  });

  it('covers every policy the runner applies', () => {
    expect(Object.keys(POLICIES).sort()).toEqual(
      [
        'boundary.resume',
        'budgets',
        'content.integrity',
        'csp',
        'css',
        'graph',
        'html.basics',
        'html.forms',
        'html.references',
        'html.styleAttr',
        'js.appApis',
        'js.externalUrls',
        'routes.coverage',
        'text.forbidden',
      ].sort(),
    );
  });
});

describe('load', () => {
  it('maps references to dist paths, and anything off-site to null', () => {
    const site = { base: BASE };
    expect(toDistPath(site, `${BASE}/_assets/a.js?v=1#x`, 'index.html')).toBe('_assets/a.js');
    expect(toDistPath(site, '../fonts/x.woff2', '_assets/site.css')).toBe('fonts/x.woff2');
    expect(toDistPath(site, './play.js', 'doom-engine/play.html')).toBe('doom-engine/play.js');
    expect(toDistPath(site, '/elsewhere/a.js', 'index.html')).toBe(
      '__outside_base__/elsewhere/a.js',
    );
    for (const ref of ['https://x.test/a.js', '//x.test/a.js', 'data:,', 'mailto:a@b.c'])
      expect(toDistPath(site, ref, 'index.html')).toBeNull();
  });

  it('keeps one line per block element in the visible text', () => {
    const site = makeSite(
      {
        'index.html':
          '<main><h1>Title</h1><ul><li>One <b>two</b></li><li>Three</li></ul><script>x</script></main>',
      },
      { base: BASE, siteOrigin: ORIGIN },
    );
    expect(site.pages[0]?.mainText).toBe('Title\nOne two\nThree');
  });

  it("follows static imports only: a page's closure never includes its lazy steps", () => {
    const site = siteOf(fixture());
    expect([...staticClosure(site, ['_assets/home.js'])].sort()).toEqual([
      '_assets/home.js',
      '_assets/lifecycle.js',
    ]);
  });
});

describe('html.basics', () => {
  it('requires lang, a description and exactly one <h1>', () => {
    const fx = variant((f) => {
      patch(f, 'projects/index.html', '<html lang="en">', '<html>');
      patch(f, 'credits/index.html', 'name="description"', 'name="summary"');
      patch(f, 'tribute/index.html', '<h1>A page</h1>', '<h1>A</h1><h1>B</h1>');
    });
    expect(problems('html.basics', fx)).toEqual([
      'credits/index.html: missing description',
      'projects/index.html: missing <html lang>',
      'tribute/index.html: expected exactly one <h1>',
    ]);
  });
});

describe('html.styleAttr', () => {
  it('finds style attributes however they are quoted', () => {
    const fx = variant((f) => {
      patch(f, 'projects/index.html', '<h1>', `<h1 style='color:red'>`);
      patch(f, 'credits/index.html', '<h1>', '<h1 style=color:red>');
    });
    expect(problems('html.styleAttr', fx)).toEqual([
      'credits/index.html: style attribute on <h1>',
      'projects/index.html: style attribute on <h1>',
    ]);
  });
});

describe('csp', () => {
  it('rejects a second inline script', () => {
    const fx = variant((f) => patch(f, 'index.html', '</main>', '<script>1</script></main>'));
    expect(problems('csp', fx)).toEqual(['index.html: expected 1 inline script, found 2']);
  });

  it('rejects any policy that differs from buildCsp, even by whitespace', () => {
    const fx = variant((f) => {
      patch(f, 'projects/index.html', "script-src 'self'", "script-src 'self' 'unsafe-inline'");
      patch(f, 'credits/index.html', "default-src 'self'; ", "default-src 'self';\n");
    });
    expect(problems('csp', fx)).toEqual([
      'credits/index.html: CSP differs from buildCsp(hash of the inline script)',
      'projects/index.html: CSP differs from buildCsp(hash of the inline script)',
    ]);
  });

  it('rejects a boot script the CSP does not pin', () => {
    const fx = variant((f) =>
      patch(f, 'resume/index.html', `<script>${BOOT_RESUME}</script>`, '<script>1</script>'),
    );
    expect(problems('csp', fx)).toEqual([
      'resume/index.html: CSP differs from buildCsp(hash of the inline script)',
    ]);
  });

  it('holds the engine frame to ENGINE_CSP and no inline script', () => {
    const fx = variant((f) => {
      patch(f, 'doom-engine/play.html', "base-uri 'none'", "base-uri 'self'");
      patch(f, 'doom-engine/play.html', '</body>', '<script>1</script></body>');
    });
    expect(problems('csp', fx)).toEqual([
      'doom-engine/play.html: engine CSP differs from ENGINE_CSP',
      'doom-engine/play.html: inline script in the engine frame',
    ]);
  });

  it('requires the CSP meta', () => {
    const fx = variant((f) =>
      patch(f, 'privacy/index.html', 'http-equiv="Content-Security-Policy"', 'name="x"'),
    );
    expect(problems('csp', fx)).toEqual(['privacy/index.html: missing CSP meta']);
  });
});

describe('text.forbidden', () => {
  it('flags scam-flow phrasing and form numbers with a 7 anywhere served', () => {
    const fx = variant((f) => {
      patch(f, 'index.html', '</main>', '<p>Case DRV-123457</p></main>');
      append(f, '_assets/home.js', '"Verify you are human"');
    });
    expect(problems('text.forbidden', fx)).toEqual([
      '_assets/home.js: real-CAPTCHA phrasing: /verify you are human/i',
      'index.html: form numbers never contain a 7: /DRV-\\d*7\\d*\\b/',
    ]);
  });
});

describe('html.forms', () => {
  it('rejects forms, credential inputs and sensitive autofill', () => {
    const fx = variant((f) =>
      patch(
        f,
        'index.html',
        '</main>',
        '<form><input type="password"><input autocomplete="cc-number"></form></main>',
      ),
    );
    expect(problems('html.forms', fx)).toEqual([
      'index.html: <form> element',
      'index.html: input type=password',
      'index.html: autocomplete=cc-number',
    ]);
  });
});

describe('js.appApis', () => {
  it('rejects unseeded randomness, transmission and test hooks in app chunks', () => {
    const fx = variant((f) => {
      append(f, '_assets/home.js', 'Math.random();');
      append(f, '_assets/privacy.js', 'navigator.sendBeacon("/x");window.__uvcr={};');
    });
    expect(problems('js.appApis', fx)).toEqual([
      '_assets/home.js: unseeded randomness: /Math\\.random\\(/',
      '_assets/privacy.js: test hook: /__uvcr|PUBLIC_TEST_HOOKS/',
      '_assets/privacy.js: transmit API: /sendBeacon|XMLHttpRequest|\\bWebSocket\\b|\\bEventSource\\b/',
    ]);
  });

  it('rejects permission prompts, fingerprinting and clipboard reads', () => {
    const fx = variant((f) => {
      append(
        f,
        '_assets/ceremony.js',
        'Notification.requestPermission();navigator.hardwareConcurrency;',
      );
      append(f, '_assets/doom.js', 'e.clipboardData;');
    });
    expect(problems('js.appApis', fx).map((p) => p.split(':').slice(0, 2).join(':'))).toEqual([
      '_assets/ceremony.js: permission prompt API',
      '_assets/ceremony.js: fingerprinting API',
      '_assets/doom.js: clipboard access',
    ]);
  });
});

describe('js.externalUrls', () => {
  it('allows the site and its plain link targets, and nothing else', () => {
    const fx = variant((f) => {
      append(
        f,
        '_assets/home.js',
        `"${ORIGIN}/x";"https://github.com/DavidPurvis/repo";"https://tracker.example/p"`,
      );
    });
    expect(problems('js.externalUrls', fx)).toEqual([
      '_assets/home.js: unexpected URL https://tracker.example/p',
    ]);
  });
});

describe('css', () => {
  it('rejects external and broken url() references and oversized stylesheets', () => {
    const fx = variant((f) => {
      append(
        f,
        '_assets/site.css',
        'a{background:url(https://cdn.example/x.png)}b{background:url(gone.svg)}',
      );
      f['_assets/big.css'] = noise(30_000);
    });
    expect(problems('css', fx)).toEqual([
      '_assets/site.css: external url(): https://cdn.example/x.png',
      '_assets/site.css: broken url(): gone.svg',
      '_assets/big.css: over 16 KB gz',
    ]);
  });
});

describe('html.references', () => {
  it('rejects third-party loads, broken references and unprotected new tabs', () => {
    const fx = variant((f) => {
      patch(
        f,
        'projects/index.html',
        '</main>',
        '<img src="https://img.example/a.png" alt=""><img src="gone.png" alt=""><a href="https://github.com/DavidPurvis" target="_blank">x</a></main>',
      );
      patch(
        f,
        'credits/index.html',
        '</main>',
        '<script type="module" src="/elsewhere/a.js"></script></main>',
      );
    });
    expect(problems('html.references', fx)).toEqual([
      'credits/index.html: broken reference: /elsewhere/a.js',
      'projects/index.html: third-party <img>: https://img.example/a.png',
      'projects/index.html: broken reference: gone.png',
      'projects/index.html: target=_blank without noopener: https://github.com/DavidPurvis',
    ]);
  });

  it('accepts links to a directory route and noopener new tabs', () => {
    const fx = variant((f) => {
      patch(
        f,
        'projects/index.html',
        '</head>',
        `<link rel="prefetch" href="${BASE}/resume/"></head>`,
      );
      patch(
        f,
        'projects/index.html',
        '</main>',
        '<a href="https://github.com/DavidPurvis" target="_blank" rel="noopener noreferrer">x</a></main>',
      );
    });
    expect(problems('html.references', fx)).toEqual([]);
  });
});

describe('graph', () => {
  it('fails without a chunk graph, and on a script the graph does not know', () => {
    expect(problems('graph', { ...fixture(), graph: null })).toEqual([
      'reports/chunk-graph.json: chunk graph missing',
    ]);
    const fx = variant((f) => {
      f['_assets/stray.js'] = 'export {};';
    });
    expect(problems('graph', fx)).toEqual(['_assets/stray.js: not in the chunk graph']);
  });
});

describe('budgets', () => {
  it("measures each page's static closure against its route budget", () => {
    const rows = new Map(
      budgetRows(siteOf(fixture())).map(([r, total, budget]) => [r, { total, budget }]),
    );
    expect(rows.get('/')?.budget).toBe(12 * 1024);
    expect(rows.get('/resume/')?.budget).toBe(2 * 1024);
    expect(rows.get('/projects/')).toEqual({ total: 0, budget: 0 });
  });

  it('rejects a page over budget, and any script on a page budgeted at 0 KB', () => {
    const fx = variant((f) => {
      f['_assets/home.js'] = noise(20_000);
      patch(
        f,
        'projects/index.html',
        '</main>',
        `<script type="module" src="${BASE}/_assets/doom.js"></script></main>`,
      );
    });
    expect(gz(fx.files['_assets/home.js'] ?? '')).toBeGreaterThan(12 * 1024);
    expect(
      problems('budgets', fx).map((p) => p.replace(/[\d.]+ KB gz over/, 'N KB gz over')),
    ).toEqual(['/: N KB gz over 12.0 KB', '/projects/: N KB gz over 0.0 KB']);
  });

  it('holds lazy chunks to their own budget, and keeps heavy chunks out of static closures', () => {
    const fx = variant((f) => {
      f['_assets/ceremony.js'] = noise(12_000);
      f['_assets/lifecycle.js'] = noise(40_000);
    });
    const found = problems('budgets', fx);
    expect(found.some((p) => /^_assets\/ceremony\.js: lazy chunk .* over 6 KB$/.test(p))).toBe(
      true,
    );
    expect(
      found.some((p) => /^_assets\/lifecycle\.js: .* chunk in a page's static closure$/.test(p)),
    ).toBe(true);
  });
});

describe('routes.coverage', () => {
  it('fails on a missing route and on a page outside the route table', () => {
    const fx = variant((f) => {
      delete f['tribute/index.html'];
      f['casino/index.html'] = page('casino/');
    });
    expect(problems('routes.coverage', fx)).toEqual([
      '.: route missing from the build: /tribute/',
      '.: page not in the route table: /casino/',
    ]);
  });
});

describe('boundary.resume', () => {
  it('rejects a résumé page whose static closure carries the kernel', () => {
    const fx = variant((_, g) => {
      g['_assets/lifecycle.js']?.modules.push('src/runtime/kernel.ts');
    });
    const found = problems('boundary.resume', fx);
    expect(found).toContain(
      'resume/index.html: loads src/runtime/kernel.ts (via _assets/lifecycle.js)',
    );
    expect(found).toHaveLength(4);
  });

  it('allows the lifecycle module, and nothing else of the runtime, steps or domain', () => {
    for (const m of [
      'src/scenes/casino/index.ts',
      'src/case/policy.ts',
      'src/content/department/case.ts',
    ])
      expect(
        problems(
          'boundary.resume',
          variant((_, g) => {
            g['_assets/print.js']?.modules.push(m);
          }),
        ),
      ).toContain(`resume/index.html: loads ${m} (via _assets/print.js)`);
  });

  it('rejects the case record key and departmental copy on the résumé', () => {
    const sentence = departmentStrings().find((s) => !/[&<>"]/.test(s)) ?? '';
    expect(sentence.length).toBeGreaterThan(0);
    const fx = variant((f) => {
      append(f, '_assets/print.js', '"uvcr:case"');
      patch(f, 'resume/for/emb/index.html', '</main>', `<p>${sentence}</p></main>`);
      append(f, 'resume.md', `\n${sentence}\n`);
    });
    const found = problems('boundary.resume', fx);
    expect(found).toContain('resume/index.html: _assets/print.js mentions the case record');
    expect(found).toContain(
      `resume/for/emb/index.html: departmental copy: "${sentence.slice(0, 50)}"`,
    );
    expect(found).toContain(`resume.md: departmental copy: "${sentence.slice(0, 50)}"`);
  });
});

describe('content.integrity', () => {
  it('runs R1–R12 over the built résumé text, resume.md and llms.txt', () => {
    const fx = variant((f) => {
      patch(f, 'resume/for/plt/index.html', '</main>', '<p>C Spire DevOps work</p></main>');
      append(f, 'llms.txt', '\nGraduated summa cum laude.\n');
    });
    const found = problems('content.integrity', fx);
    expect(found).toHaveLength(2);
    expect(found[0]).toMatch(/^resume\/for\/plt\/index\.html: \n.*R2/s);
    expect(found[1]).toMatch(/^llms\.txt: \n.*R1/s);
  });

  it('reads each block as its own line, so neighbouring blocks never combine', () => {
    // The PLT cut's C Spire role sits next to the "Platform, DevOps and SRE" label.
    const fx = variant((f) =>
      patch(
        f,
        'resume/for/plt/index.html',
        '<h1>A page</h1>',
        '<h1>A page</h1><p>Platform, DevOps and SRE</p>',
      ),
    );
    expect(problems('content.integrity', fx)).toEqual([]);
  });
});
