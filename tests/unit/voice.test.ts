/**
 * The institution's voice (C4, C5): it is completely serious about itself. No exclamation marks,
 * no winking, short notices and step bodies, and a finding never repeats word for word from one
 * surface to the next.
 */
import { describe, expect, it } from 'vitest';
import * as caseCopy from '../../src/content/institution/case';
import * as ceremonyCopy from '../../src/content/institution/ceremony';
import * as scopeCopy from '../../src/content/institution/scope';
import * as previewCopy from '../../src/content/institution/preview';
import * as releaseCopy from '../../src/content/institution/release';
import * as findingsCopy from '../../src/content/institution/findings';
import * as ackCopy from '../../src/content/institution/acknowledgment';
import type { FindingId } from '../../src/domain/findings';
import { SERVICE_IDS } from '../../src/domain/assessment';

const BANNED = [
  'lol',
  'lmao',
  'jk',
  'just kidding',
  'oops',
  'haha',
  'epic',
  'vibe',
  'satire',
  'parody',
];

/** Every string the institution can say, with templates filled in with sample values. */
function sayings(value: unknown, out: string[] = []): string[] {
  if (typeof value === 'string') out.push(value);
  else if (typeof value === 'function') {
    const f = value as (...a: unknown[]) => unknown;
    for (const args of [[1], [2], ['DRV-123456'], ['Backend', 2], [3, 2]]) sayings(f(...args), out);
  } else if (Array.isArray(value)) for (const v of value) sayings(v, out);
  else if (value && typeof value === 'object')
    for (const v of Object.values(value)) sayings(v, out);
  return out;
}

// findingLines is a Record<FindingId, …>, so its keys are every finding.
const FINDING_IDS = Object.keys(caseCopy.findingLines) as FindingId[];
const words = (s: string) => s.split(/\s+/).filter(Boolean).length;
const all = [
  caseCopy,
  scopeCopy,
  previewCopy,
  releaseCopy,
  ceremonyCopy,
  findingsCopy,
  ackCopy,
].flatMap((m) => sayings(m));

describe('institutional voice', () => {
  it('never exclaims', () => {
    expect(all.length).toBeGreaterThan(100);
    expect(all.filter((s) => s.includes('!'))).toEqual([]);
  });

  it('never winks', () => {
    const hits = all.filter((s) =>
      BANNED.some((w) => new RegExp(`(^|[^a-z])${w}([^a-z]|$)`, 'i').test(s)),
    );
    expect(hits).toEqual([]);
  });

  it('keeps notices to 25 words and step bodies to 45', () => {
    expect(words(caseCopy.notice.text)).toBeLessThanOrEqual(25);
    const bodies = [
      scopeCopy.scope.body,
      previewCopy.preview.body,
      releaseCopy.release.body,
      ceremonyCopy.ceremony.body,
      findingsCopy.findingsCopy.body,
      ackCopy.acknowledgment.pending.body,
      ackCopy.acknowledgment.acknowledged.body,
      ackCopy.acknowledgment.appealed.body,
      caseCopy.dispositionCopy.summary,
    ];
    for (const b of bodies) expect(words(b), b).toBeLessThanOrEqual(45);
  });

  it('a finding reads differently on every surface it appears on (C4)', () => {
    for (const id of FINDING_IDS) {
      const l = caseCopy.findingLines[id];
      const surfaces = [l.status, l.findings(2), l.disposition(2)].filter(Boolean);
      expect(new Set(surfaces).size, id).toBe(surfaces.length);
    }
    for (const id of SERVICE_IDS) {
      const svc = ceremonyCopy.services[id];
      if (!svc.cited) continue;
      expect(svc.cited).not.toBe(svc.verdict);
      for (const f of FINDING_IDS) {
        const l = caseCopy.findingLines[f];
        expect([l.status, l.findings(2), l.disposition(2)]).not.toContain(svc.cited);
      }
    }
  });

  it('never mentions a form number with a 7 in it', () => {
    expect(all.filter((s) => /DRV-\d*7/.test(s))).toEqual([]);
  });
});
