/**
 * Source-level policies that types alone can't express. Later phases extend this file as the
 * runtime, steps and clean-résumé boundary land.
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

describe('domain purity', () => {
  const domain = files('src/domain');

  it('the domain imports nothing but itself', () => {
    for (const f of domain)
      for (const spec of importsOf(read(f)))
        expect(spec.startsWith('./'), `${f} imports ${spec}`).toBe(true);
  });

  it('the domain touches no DOM, storage, clock or Math.random', () => {
    for (const f of domain) {
      const src = read(f);
      expect(src, f).not.toMatch(
        /(?<![\w-])(?:document|window|localStorage|sessionStorage|navigator)\s*\.|Date\.now|performance\.now|Math\.random/,
      );
    }
  });

  it('the reducer and findings never read randomness (A6)', () => {
    for (const f of ['src/domain/case.ts', 'src/domain/findings.ts'])
      expect(importsOf(read(f)), f).not.toContain('./random');
  });
});

describe('steps and runtime', () => {
  const code = (f: string) => read(f).replace(/\/\*[^]*?\*\/|\/\/.*$/gm, '');

  it('steps own nothing directly: timers, listeners and frames go through their Scope (§L)', () => {
    for (const f of files('src/steps'))
      expect(code(f), f).not.toMatch(
        /\b(?:setTimeout|setInterval|requestAnimationFrame|addEventListener)\s*\(/,
      );
  });

  it('only the lifecycle and the announcer touch raw timers or listeners', () => {
    const allowed = new Set(['src/runtime/lifecycle.ts', 'src/runtime/announce.ts']);
    for (const f of files('src/runtime').filter((f) => !allowed.has(f)))
      expect(code(f), f).not.toMatch(/\b(?:setTimeout|setInterval|addEventListener)\s*\(/);
  });

  it('builds DOM from text only, reads no randomness and stores nothing outside the case', () => {
    for (const f of [...files('src/steps'), ...files('src/runtime')]) {
      const src = code(f);
      expect(src, f).not.toMatch(/innerHTML|outerHTML|insertAdjacentHTML|document\.write/);
      expect(src, f).not.toMatch(/Math\.random/);
      expect(src, f).not.toMatch(/\blocalStorage\b/);
    }
  });

  it('only the kernel reduces, persists, or loads steps', () => {
    const owners = new Set(['src/runtime/kernel.ts', 'src/runtime/persistence.ts']);
    for (const f of [...files('src/steps'), ...files('src/runtime')]) {
      if (owners.has(f)) continue;
      const src = code(f);
      expect(src, f).not.toMatch(/\breduce\(|\bsave\(|import\(['"]\.\.\/steps/);
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

  it('the résumé never imports the case, its steps, its domain or its copy', () => {
    for (const f of RESUME_SURFACE)
      for (const spec of importsOf(read(f)))
        expect(spec, `${f} imports ${spec}`).not.toMatch(
          /\/(domain|steps|content\/institution)\/|runtime\/(kernel|persistence|signals|title)/,
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
