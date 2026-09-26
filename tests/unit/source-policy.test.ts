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
