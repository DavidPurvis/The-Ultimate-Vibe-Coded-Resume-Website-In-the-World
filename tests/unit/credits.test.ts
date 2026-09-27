import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ICON_MANIFEST, LEDGER } from '../../src/content/credits';

const PUBLIC = join(process.cwd(), 'public');

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const covered = new Set(LEDGER.flatMap((e) => e.files ?? []));
/** Built or vendored at build time, and credited as their sources (DOOM, rasterized favicons). */
const GENERATED = /^(generated|doom-engine)\//;

describe('asset ledger', () => {
  it('every shipped asset in public/ is credited, or generated from a credited source', () => {
    const files = walk(PUBLIC)
      .map((f) => relative(PUBLIC, f).split('\\').join('/'))
      .filter((f) => !GENERATED.test(f) && f !== 'og.png');
    for (const f of files) expect(covered.has(f), f).toBe(true);
  });

  it('every file listed in the ledger exists', () => {
    for (const f of covered) expect(existsSync(join(PUBLIC, f)), f).toBe(true);
  });

  it('every entry names a licence and an author', () => {
    for (const e of LEDGER) {
      expect(e.license, e.id).toBeTruthy();
      expect(e.author, e.id).toBeTruthy();
    }
  });
});

describe('icon manifest', () => {
  it('every lucide icon exists', () => {
    for (const n of ICON_MANIFEST.lucide) {
      expect(
        existsSync(join(process.cwd(), 'node_modules/lucide-static/icons', `${n}.svg`)),
        n,
      ).toBe(true);
    }
  });
});
