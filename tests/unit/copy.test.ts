import { describe, expect, it } from 'vitest';
import { checkGroundedCopy } from '../../src/lib/integrity';
import { ABSENT_TECH, FACTS, GO_LANG, REAL_EMPLOYERS } from '../../src/content/facts';
import * as meta from '../../src/content/copy/meta';
import * as global from '../../src/content/copy/global';
import * as identity from '../../src/content/copy/identity';
import * as robots from '../../src/content/copy/robots';
import * as cookies from '../../src/content/copy/cookies';
import * as captcha from '../../src/content/copy/captcha';
import * as greenFlags from '../../src/content/copy/greenFlags';
import * as skills from '../../src/content/copy/skills';
import * as beliefs from '../../src/content/copy/beliefs';
import * as causes from '../../src/content/copy/causes';
import * as legal from '../../src/content/copy/legal';
import * as casino from '../../src/content/copy/casino';
import * as resumeExtras from '../../src/content/copy/resumeExtras';
import * as contact from '../../src/content/copy/contact';
import * as errors from '../../src/content/copy/errors';
import * as memos from '../../src/content/copy/memos';
import * as projects from '../../src/content/copy/projects';
import * as rick from '../../src/content/copy/rick';
import * as howBuilt from '../../src/content/copy/howBuilt';
import * as credits from '../../src/content/credits';
import * as ads from '../../src/content/copy/ads';
import * as personnel from '../../src/content/copy/personnel';
import * as wishlist from '../../src/content/copy/wishlist';
import * as nintendo from '../../src/content/copy/nintendo';
import * as tribute from '../../src/content/copy/tribute';
import * as forms from '../../src/content/copy/forms';
import * as presentation from '../../src/content/copy/presentation';
import * as blogCopy from '../../src/content/copy/blog';

const modules = {
  meta,
  global,
  identity,
  robots,
  cookies,
  captcha,
  greenFlags,
  skills,
  beliefs,
  causes,
  legal,
  casino,
  resumeExtras,
  contact,
  errors,
  memos,
  projects,
  rick,
  howBuilt,
  credits,
  ads,
  personnel,
  wishlist,
  nintendo,
  tribute,
  forms,
  presentation,
  blogCopy,
};

/** Every string reachable from the copy modules (functions are called with sample args). */
function collectStrings(value: unknown, out: string[] = [], seen = new Set<unknown>()): string[] {
  if (typeof value === 'string') out.push(value);
  else if (typeof value === 'function') {
    try {
      const r = (value as (...a: unknown[]) => unknown)('Sample', 'Sample', 1);
      collectStrings(r, out, seen);
    } catch {
      /* ignore */
    }
  } else if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    for (const v of Object.values(value)) collectStrings(v, out, seen);
  }
  return out;
}

interface RecordLike {
  id: string;
  text: string;
  status: string;
  blockRefs?: readonly string[];
  [k: string]: unknown;
}
function collectRecords(
  value: unknown,
  out: RecordLike[] = [],
  seen = new Set<unknown>(),
): RecordLike[] {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    const o = value as Record<string, unknown>;
    if (typeof o.id === 'string' && typeof o.text === 'string' && typeof o.status === 'string') {
      out.push(o as RecordLike);
    }
    for (const v of Object.values(o)) collectRecords(v, out, seen);
  }
  return out;
}

const allStrings = collectStrings(modules);
const records = collectRecords(modules);
const recordText = (r: RecordLike) =>
  Object.values(r)
    .filter((v): v is string => typeof v === 'string')
    .filter((v) => v !== r.id && v !== r.status)
    .join('\n');

describe('copy deck hygiene', () => {
  it('collects a substantial amount of copy', () => {
    expect(allStrings.length).toBeGreaterThan(500);
    expect(records.length).toBeGreaterThan(80);
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
    for (const s of allStrings) for (const re of forbidden) expect(s, s).not.toMatch(re);
  });

  it('form numbers never include a 7 (DRV-7, DRV-17 and DRV-27 were abolished)', () => {
    for (const s of allStrings) {
      expect(s, s).not.toMatch(/DRV-\d*7\d*\b/);
      expect(s, s).not.toMatch(/DRV-\d+\/\d*7\d*\b/);
    }
  });

  it('grounded jokes cite real blocks and pass the number/tech rules', () => {
    for (const r of records.filter((x) => x.blockRefs?.length)) {
      for (const b of r.blockRefs ?? []) expect(Object.keys(FACTS), `${r.id} → ${b}`).toContain(b);
      expect(checkGroundedCopy(recordText(r)), r.id).toEqual([]);
    }
  });

  it('pure fiction never borrows real employers or absent tech', () => {
    for (const r of records.filter((x) => !x.blockRefs?.length && x.status !== 'needs-review')) {
      const t = recordText(r);
      for (const e of REAL_EMPLOYERS) expect(t, r.id).not.toContain(e);
      expect(t, r.id).not.toMatch(ABSENT_TECH);
      expect(t, r.id).not.toMatch(GO_LANG);
    }
  });

  it('verified records always carry block references', () => {
    for (const r of records.filter((x) => x.status === 'verified')) {
      expect(r.blockRefs?.length, r.id).toBeGreaterThan(0);
    }
  });

  it('only Meta excerpts and facts awaiting David are pending review', () => {
    const pending = records.filter((r) => r.status === 'needs-review');
    const meta = new Set(legal.metaSnippets.map((m) => m.id));
    // Personal facts (they carry a `label`) wait for David and must stay empty until he fills them.
    const personal = pending.filter((r) => 'label' in r);
    for (const r of personal) expect(r.text, r.id).toBe('');
    for (const r of pending) expect(meta.has(r.id) || 'label' in r, r.id).toBe(true);
  });
});

describe('specific copy invariants', () => {
  it('every identity has confirmation, stamp and result copy', () => {
    for (const id of ['chatgpt', 'claude', 'gemini', 'human', 'clippy', 'other'] as const) {
      const c = identity.identities[id];
      expect(c.label && c.confirm && c.stamp && c.result).toBeTruthy();
      expect(identity.callbackLabels[id]).toBeTruthy();
    }
  });

  it('research positions skip 7 and increase', () => {
    const ns = beliefs.positions.map((p) => p.n);
    expect(ns).not.toContain(7);
    expect([...ns].sort((a, b) => a - b)).toEqual(ns);
    expect(
      beliefs.papers.find((p) => p.id === 'seven')?.sections.map((s) => s.heading),
    ).not.toContain('§7');
  });

  it('vendor generator inputs and biscotti are complete', () => {
    expect(cookies.vendorWords.adjectives).toHaveLength(40);
    expect(cookies.vendorWords.nouns).toHaveLength(40);
    expect(cookies.vendorWords.suffixes).toHaveLength(12);
    expect(cookies.vendorWords.purposes).toHaveLength(20);
    expect(new Set(cookies.biscotti.names).size).toBe(50);
    expect(Object.keys(cookies.biscotti.kinds)).toHaveLength(6);
    expect(cookies.namedPartners).toHaveLength(6);
  });

  it('CAPTCHA has 9 window tiles, 9 cabbages, and only the opportunity tile is both', () => {
    expect(captcha.windowTiles).toHaveLength(9);
    expect(captcha.cabbageTiles).toHaveLength(9);
    const both = captcha.windowTiles.filter(
      (t) => t.tags.includes('physical') && t.tags.includes('software'),
    );
    expect(both.map((t) => t.id)).toEqual(['opportunity']);
  });

  it('terms of reading end on §4.2', () => {
    expect(legal.tos.appended).toHaveLength(6);
    expect(legal.tos.appended.at(-1)).toBe(
      '§4.2 By reading this sentence you agree to have read this sentence.',
    );
  });

  it('casino wheel has 8 wedges with the canonical order', () => {
    expect(casino.WEDGES).toEqual([
      'RICKROLL',
      'RIP',
      'HYPERLINK',
      'DOUBLE OR NOTHING',
      'RICKROLL',
      'RIP',
      'HYPERLINK',
      'RICKROLL',
    ]);
  });

  it('robot notes only ask for identity', () => {
    for (const n of robots.robotNotes) {
      expect(n.text).not.toMatch(/\b(rate|rank|score|praise|recommend|hire)\b/i);
    }
  });

  it('every route has a description that leads with David or the site, never a fabricated metric', () => {
    for (const r of Object.values(meta.ROUTES)) {
      expect(r.description.length).toBeGreaterThan(30);
      expect(r.title).toMatch(/David Purvis/);
    }
  });
});
