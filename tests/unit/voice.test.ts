/**
 * The Department's voice: it is completely serious about itself. It explains procedures, never
 * the comedy; it never exclaims or winks; notices are short; and every notice ID has its words.
 */
import { describe, expect, it } from 'vitest';
import * as caseCopy from '../../src/content/department/case';
import * as shellCopy from '../../src/content/department/shell';
import { NOTICE_IDS } from '../../src/case/state';
import { releaseSummary } from '../../src/case/policy';

const BANNED = [
  /\blol\b/i,
  /\blmao\b/i,
  /\bjk\b/i,
  /just kidding/i,
  /\boops\b/i,
  /\bhaha\b/i,
  /\bepic\b/i,
  /\bvibe/i,
  /\bsatire\b/i,
  /\bparody\b/i,
  /house is rigged/i,
  /verifies nothing/i,
  /contains no jokes/i,
];

/** Every string the Department can say, with templates filled in. */
function sayings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (typeof value === 'function') {
    const f = value as (...a: unknown[]) => unknown;
    const none = releaseSummary(
      { departments: [], issuedNotices: [], released: false },
      {
        classification: null,
        verification: null,
        allocationLosses: 0,
        appendixOpened: false,
        cookiePending: false,
      },
    );
    sayings(f(none), out);
    sayings(
      f({
        ...none,
        departments: 3,
        classification: 'withheld',
        verification: 'skipped',
        allocationLosses: 2,
        appendixOpened: true,
        supported: true,
      }),
      out,
    );
  } else if (Array.isArray(value)) for (const v of value) sayings(v, out);
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) sayings(v, out);
  return out;
}

const all = [caseCopy, shellCopy].flatMap((m) => sayings(m));
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;

describe('departmental voice', () => {
  it('never exclaims, winks or explains the joke', () => {
    expect(all.length).toBeGreaterThan(15);
    expect(all.filter((s) => s.includes('!'))).toEqual([]);
    for (const s of all) for (const re of BANNED) expect(s, s).not.toMatch(re);
  });

  it('every notice has its words, and a notice is short', () => {
    for (const id of NOTICE_IDS) {
      const text = caseCopy.notices[id];
      expect(text, id).toBeTruthy();
      expect(words(text), id).toBeLessThanOrEqual(25);
    }
  });

  it('the determination cites only what was recorded, or says nothing was supplied', () => {
    const none = sayings(caseCopy.determinationSummary)[0] ?? '';
    expect(none).toBe('No departments consulted. No supporting declarations were supplied.');
    const full = sayings(caseCopy.determinationSummary)[1] ?? '';
    expect(full).toBe(
      '3 departments consulted. Classification: withheld. Verification: skipped. 2 unsuccessful allocations on file. Removed material: reviewed.',
    );
  });
});
