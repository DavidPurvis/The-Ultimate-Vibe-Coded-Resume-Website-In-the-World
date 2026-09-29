import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { checkResumeText } from '../../../src/lib/integrity';
import { REAL_EMPLOYERS } from '../../../src/content/resume/lexicon';

const DIR = join(process.cwd(), 'src/blog');
const posts = readdirSync(DIR)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = readFileSync(join(DIR, f), 'utf8');
    const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
    return { file: f, front: m?.[1] ?? '', body: m?.[2] ?? '' };
  });

describe('the Department Newsletter', () => {
  it('has the five promised posts', () => {
    expect(posts.map((p) => p.file).sort()).toEqual([
      'goldfish.md',
      'national-security.md',
      'ordained.md',
      'thermite-mute.md',
      'zipper-merge.md',
    ]);
  });

  it('every post passes the claim rules (no invented tech, titles or honors)', () => {
    for (const p of posts) expect(checkResumeText(p.body, 'blog'), p.file).toEqual([]);
  });

  it('only posts that cite résumé blocks may name a real employer', () => {
    for (const p of posts) {
      if (/blockRefs:/.test(p.front)) continue;
      for (const e of REAL_EMPLOYERS) expect(p.body, `${p.file} names ${e}`).not.toContain(e);
    }
  });

  it('nobody but the rigged simulation declares a winner', () => {
    const sim = posts.filter((p) => p.body.includes('data-aem-sim'));
    expect(sim.map((p) => p.file)).toEqual(['zipper-merge.md']);
    expect(sim[0]?.body).toMatch(/traffic engineers recommend the zipper merge/);
  });
});
