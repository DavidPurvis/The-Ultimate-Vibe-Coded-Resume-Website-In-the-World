/**
 * Source-level policies that types alone can't express: a pure case core, a disciplined
 * runtime, a résumé that imports nothing of the Department, and one owner of browser storage.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(p, 'utf8');
const files = (dir: string) =>
  readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && /\.(ts|astro)$/.test(d.name))
    .map((d) => join(d.parentPath, d.name));
const importsOf = (src: string) =>
  [...src.matchAll(/^\s*import[^'"]*['"]([^'"]+)['"]/gm)].map((m) => m[1] ?? '');

describe('purity of the case core', () => {
  const pure = ['src/case/state.ts', 'src/case/policy.ts', 'src/domain/random.ts'];

  it('state and policy import only each other, and state imports nothing', () => {
    expect(importsOf(read('src/case/state.ts'))).toEqual([]);
    for (const f of pure)
      for (const spec of importsOf(read(f)))
        expect(spec.startsWith('./'), `${f} imports ${spec}`).toBe(true);
  });

  it('touches no DOM, storage, clock or Math.random', () => {
    for (const f of pure)
      expect(read(f), f).not.toMatch(
        /(?<![\w-])(?:document|window|localStorage|sessionStorage|navigator)\s*\.|Date\.now|performance\.now|Math\.random/,
      );
  });

  it('storage imports the case state, never its copy or its policy', () => {
    const specs = importsOf(read('src/lib/storage.ts'));
    expect(specs).toEqual(['../case/state']);
  });
});

describe('runtime', () => {
  const code = (f: string) => read(f).replace(/\/\*[^]*?\*\/|\/\/.*$/gm, '');

  it('only the lifecycle and the announcer touch raw timers or listeners', () => {
    const allowed = new Set(['src/runtime/lifecycle.ts', 'src/runtime/announce.ts']);
    for (const f of files('src/runtime').filter((f) => !allowed.has(f)))
      expect(code(f), f).not.toMatch(/\b(?:setTimeout|setInterval|addEventListener)\s*\(/);
  });

  it('builds DOM from text only and reads no randomness', () => {
    for (const f of [...files('src/runtime'), ...files('src/case')]) {
      const src = code(f);
      expect(src, f).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
      expect(src, f).not.toMatch(/Math\.random/);
    }
  });
});

describe('the résumé boundary, at the source (A-10)', () => {
  const RESUME_SURFACE = [
    'src/layouts/Resume.astro',
    'src/components/ResumeDocument.astro',
    'src/components/LaneSwitcher.astro',
    'src/pages/resume/index.astro',
    'src/pages/resume/for/[lane].astro',
    'src/scripts/resume-page.ts',
  ];

  it('the résumé never imports the Department: its case, scenes, copy, mode or storage', () => {
    for (const f of RESUME_SURFACE)
      for (const spec of importsOf(read(f)))
        expect(spec, `${f} imports ${spec}`).not.toMatch(
          /\/(case|scenes|domain)\/|content\/(department|copy)\/|lib\/(scene|mode|storage)$/,
        );
  });
});

describe('storage', () => {
  it('only the storage primitives touch localStorage or sessionStorage directly', () => {
    const allowed = new Set(['src/lib/storage.ts', 'src/lib/boot.ts']);
    for (const f of files('src').filter((f) => !allowed.has(f)))
      expect(read(f).replace(/\/\*[^]*?\*\/|\/\/.*$/gm, ''), f).not.toMatch(
        /\b(localStorage|sessionStorage)\s*\./,
      );
  });
});
