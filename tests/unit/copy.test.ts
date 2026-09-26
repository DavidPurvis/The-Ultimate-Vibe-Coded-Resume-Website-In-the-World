/**
 * Copy hygiene across everything the site says: no scam-flow mimicry, no form number with a 7,
 * and the institution's fiction never borrows a real employer or a technology David doesn't use.
 */
import { describe, expect, it } from 'vitest';
import { ABSENT_TECH, GO_LANG, REAL_EMPLOYERS } from '../../src/content/facts';
import * as meta from '../../src/content/copy/meta';
import * as projects from '../../src/content/copy/projects';
import * as resumeExtras from '../../src/content/copy/resumeExtras';
import * as credits from '../../src/content/credits';
import * as home from '../../src/content/site/home';
import * as colophon from '../../src/content/site/colophon';
import * as privacy from '../../src/content/site/privacy';
import * as errors from '../../src/content/site/errors';
import * as tribute from '../../src/content/site/tribute';
import * as doom from '../../src/content/site/doom';
import * as caseCopy from '../../src/content/institution/case';
import * as scope from '../../src/content/institution/scope';
import * as preview from '../../src/content/institution/preview';
import * as release from '../../src/content/institution/release';
import * as ceremony from '../../src/content/institution/ceremony';
import * as findings from '../../src/content/institution/findings';
import * as acknowledgment from '../../src/content/institution/acknowledgment';
import { credentials } from '../../src/content/institution/credentials';

const site = {
  meta,
  projects,
  resumeExtras,
  credits,
  home,
  colophon,
  privacy,
  errors,
  tribute,
  doom,
};
const institution = { caseCopy, scope, preview, release, ceremony, findings, acknowledgment };

/** Every string reachable from the modules (functions are called with sample args). */
function collectStrings(value: unknown, out: string[] = [], seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') out.push(value);
  else if (typeof value === 'function') {
    try {
      collectStrings((value as (...a: unknown[]) => unknown)('Sample', 2), out, seen);
    } catch {
      /* ignore */
    }
  } else if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    for (const v of Object.values(value)) collectStrings(v, out, seen);
  }
  return out;
}

const siteStrings = collectStrings(site);
const institutionText = collectStrings(institution);
const all = [...siteStrings, ...institutionText];

describe('copy hygiene', () => {
  it('collects the whole deck', () => {
    expect(siteStrings.length).toBeGreaterThan(100);
    expect(institutionText.length).toBeGreaterThan(100);
  });

  it('never mimics scam verification flows', () => {
    const forbidden = [
      /verify you are human/i,
      /win\s*\+\s*r\b/i,
      /windows\s*\+\s*r\b/i,
      /ctrl\s*\+\s*v/i,
      /\.exe\b/i,
      /paste (this|the following)/i,
      /run dialog/i,
    ];
    for (const s of all) for (const re of forbidden) expect(s, s).not.toMatch(re);
  });

  it('form numbers never include a 7', () => {
    for (const s of all) expect(s, s).not.toMatch(/DRV-\d*7\d*\b/);
  });

  it('the institution’s fiction never borrows real employers or absent technology', () => {
    for (const s of institutionText) {
      for (const e of REAL_EMPLOYERS) expect(s, s).not.toContain(e);
      expect(s, s).not.toMatch(ABSENT_TECH);
      expect(s, s).not.toMatch(GO_LANG);
    }
  });

  it('asks nothing of AI agents anywhere', () => {
    for (const s of all) expect(s, s).not.toMatch(/which model|AI agents|ignore (all|previous)/i);
  });
});

describe('credentials', () => {
  it('are David’s own words, verified, with their source', () => {
    for (const c of Object.values(credentials)) {
      expect(c.status).toBe('verified');
      expect(c.source.doc).toBe('david');
    }
    expect(credentials.minister.tenure).toBe('In good standing for 8 years');
    expect(credentials.goldfish.title).toBe('High School Goldfish Honoree');
  });
});
