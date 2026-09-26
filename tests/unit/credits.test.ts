import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
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

describe('asset ledger', () => {
  it('every shipped art asset has a ledger entry', () => {
    const files = [
      ...walk(join(PUBLIC, 'captcha')),
      ...walk(join(PUBLIC, 'illustrations')),
      ...walk(join(PUBLIC, 'cursors')),
      ...['favicon.svg', 'favicon-crying.svg'].map((f) => join(PUBLIC, f)).filter(existsSync),
    ].map((f) => relative(PUBLIC, f).split('\\').join('/'));
    for (const f of files) expect(covered.has(f) || f.startsWith('captcha/cage/'), f).toBe(true);
  });

  it('every file listed in the ledger exists', () => {
    for (const f of covered) expect(existsSync(join(PUBLIC, f)), f).toBe(true);
  });

  it('licensed Cage photos (if ever added) each carry license + author', () => {
    const photos = walk(join(PUBLIC, 'captcha', 'cage')).map((f) => relative(PUBLIC, f));
    for (const p of photos) {
      const entry = LEDGER.find((e) => e.kind === 'licensed-photo' && e.files?.includes(p));
      expect(entry, p).toBeTruthy();
      expect(entry?.license && entry.author && entry.url).toBeTruthy();
    }
  });

  it('game-icons attribution (CC BY 3.0) is present', () => {
    const g = LEDGER.find((e) => e.id === 'icons-game');
    expect(g?.license).toBe('CC BY 3.0');
    expect(g?.url).toBe('https://game-icons.net/');
  });
});

describe('icon manifest', () => {
  const iconJson = (pkg: string) =>
    JSON.parse(readFileSync(join(process.cwd(), 'node_modules', pkg, 'icons.json'), 'utf8')) as {
      icons: Record<string, unknown>;
      aliases?: Record<string, unknown>;
    };
  it('every lucide icon exists', () => {
    for (const n of ICON_MANIFEST.lucide) {
      expect(
        existsSync(join(process.cwd(), 'node_modules/lucide-static/icons', `${n}.svg`)),
        n,
      ).toBe(true);
    }
  });
  it('every fluent emoji exists', () => {
    const j = iconJson('@iconify-json/fluent-emoji-flat');
    for (const n of ICON_MANIFEST.fluent)
      expect(n in j.icons || n in (j.aliases ?? {}), n).toBe(true);
  });
  it('every game icon exists', () => {
    const j = iconJson('@iconify-json/game-icons');
    for (const n of ICON_MANIFEST.game)
      expect(n in j.icons || n in (j.aliases ?? {}), n).toBe(true);
  });
});
