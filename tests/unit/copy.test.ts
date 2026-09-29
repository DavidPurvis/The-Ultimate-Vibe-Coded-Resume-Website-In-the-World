/**
 * Copy hygiene across everything the site says: no scam-flow mimicry, no form number with a 7,
 * and the Department's fiction never borrows a real employer or a technology David doesn't use.
 */
import { describe, expect, it } from 'vitest';
import { ABSENT_TECH, GO_LANG, REAL_EMPLOYERS } from '../../src/content/resume/lexicon';
import * as meta from '../../src/content/site/meta';
import * as projects from '../../src/content/site/projects';
import * as resumeExtras from '../../src/content/site/resumeExtras';
import * as credits from '../../src/content/credits';
import * as home from '../../src/content/site/home';
import * as colophon from '../../src/content/site/colophon';
import * as privacy from '../../src/content/site/privacy';
import * as errors from '../../src/content/site/errors';
import * as tribute from '../../src/content/site/tribute';
import * as doom from '../../src/content/site/doom';
import * as caseCopy from '../../src/content/department/case';
import * as shellCopy from '../../src/content/department/shell';

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
const department = { caseCopy, shellCopy };

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
const departmentText = collectStrings(department);
const all = [...siteStrings, ...departmentText];

describe('copy hygiene', () => {
  it('collects the whole deck', () => {
    expect(siteStrings.length).toBeGreaterThan(100);
    expect(departmentText.length).toBeGreaterThan(15);
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
    for (const s of all) expect(s, s).not.toMatch(/(DRV|DDP)-\d*7\d*\b/);
  });

  it('the Department’s fiction never borrows real employers or absent technology', () => {
    for (const s of departmentText) {
      for (const e of REAL_EMPLOYERS) expect(s, s).not.toContain(e);
      expect(s, s).not.toMatch(ABSENT_TECH);
      expect(s, s).not.toMatch(GO_LANG);
    }
  });

  it('asks nothing of AI agents in metadata, where crawlers read', () => {
    for (const s of collectStrings(meta))
      expect(s, s).not.toMatch(/which model|AI agents|ignore (all|previous)/i);
  });
});
