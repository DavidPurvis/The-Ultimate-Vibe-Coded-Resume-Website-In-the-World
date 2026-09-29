/** The small libraries the restored attractions share: dice, threat, formats, themes, forms. */
import { describe, expect, it } from 'vitest';
import { makeRng, mulberry32, seedFrom } from '../../../src/lib/rng';
import { level, levelIndex, POINTS } from '../../../src/lib/threat';
import { formatPhone, formatTimeLocal, PHONE_MAX } from '../../../src/lib/format';
import { parseModeParam } from '../../../src/lib/mode';
import { DEST, DEST_IDS, isDestId } from '../../../src/lib/destinations';
import { CYCLE, effective, nextTheme } from '../../../src/scenes/theme/logic';
import { postFormId } from '../../../src/lib/blog.pure';
import { threat } from '../../../src/content/copy/global';

describe('rng', () => {
  it('is deterministic per seed and in [0,1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 1000 }, () => a());
    expect(xs.slice(0, 3)).toEqual([b(), b(), b()]);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });
  it('parses ?seed= strictly', () => {
    expect(seedFrom('?seed=123')).toBe(123);
    expect(seedFrom('?seed=abc')).toBeNull();
    expect(seedFrom('?seed=99999999999')).toBeNull();
    expect(makeRng('?seed=8')()).toBe(mulberry32(8)());
  });
});

describe('threat', () => {
  it('level boundaries, in the Department’s own words', () => {
    expect([0, 2.5, 3, 6.5, 8, 11.5, 12, 99].map(levelIndex)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(level(0)).toBe(threat.levels[0]);
    expect(level(99)).toBe(threat.levels[3]);
    expect(POINTS.bannerRemoved).toBe(5);
  });
});

describe('format', () => {
  it('formats phone numbers with padding and clamping', () => {
    expect(formatPhone(0)).toBe('(000) 000-0000');
    expect(formatPhone(5551234568)).toBe('(555) 123-4568');
    expect(formatPhone(PHONE_MAX)).toBe('(999) 999-9999');
    expect(formatPhone(-5)).toBe('(000) 000-0000');
    expect(formatPhone(1e11)).toBe('(999) 999-9999');
    expect(formatPhone(Number.NaN)).toBe('(000) 000-0000');
  });
  it('formats local time', () => {
    expect(formatTimeLocal(new Date(2026, 0, 1, 9, 5))).toBe('09:05');
  });
});

describe('mode param', () => {
  it('accepts only the two internal modes (Direct access is "recruiter")', () => {
    expect(parseModeParam('?mode=recruiter')).toBe('recruiter');
    expect(parseModeParam('?mode=chaos')).toBe('chaos');
    expect(parseModeParam('?mode=direct')).toBeNull();
    expect(parseModeParam('')).toBeNull();
  });
});

describe('hyperlink allocation destinations', () => {
  it('are exact', () => {
    expect(DEST.github.href).toBe('https://github.com/DavidPurvis');
    expect(DEST.linkedin.href).toBe('https://www.linkedin.com/in/dgp0');
    expect(DEST.email.href).toBe('mailto:davidpurvis647@gmail.com');
    expect(DEST.pdf.href).toMatch(/resume\.pdf$/);
    expect(DEST.repo.href).toBe(
      'https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World',
    );
  });
  it('recognizes exactly the allocated IDs', () => {
    for (const id of DEST_IDS) expect(isDestId(id)).toBe(true);
    for (const v of ['resume', '', null, undefined, 3]) expect(isDestId(v)).toBe(false);
  });
});

describe('theme cycle', () => {
  it('cycles light → dark → darker → lights-out → comic → light', () => {
    const seq = ['light'] as string[];
    let t = 'light' as (typeof CYCLE)[number];
    for (let i = 0; i < 5; i++) {
      t = nextTheme(t, false);
      seq.push(t);
    }
    expect(seq).toEqual(['light', 'dark', 'darker', 'lights-out', 'comic', 'light']);
  });
  it('resolves system against the OS preference', () => {
    expect(effective('system', true)).toBe('dark');
    expect(nextTheme('system', true)).toBe('darker');
    expect(nextTheme('system', false)).toBe('dark');
  });
});

describe('newsletter form numbers', () => {
  it('skip 7 like every other form', () => {
    const ids = Array.from({ length: 12 }, (_, i) => postFormId(i));
    expect(ids.slice(0, 7)).toEqual([
      'DDP-28/01',
      'DDP-28/02',
      'DDP-28/03',
      'DDP-28/04',
      'DDP-28/05',
      'DDP-28/06',
      'DDP-28/08',
    ]);
    expect(ids.some((id) => /\d*7\d*/.test(id))).toBe(false);
  });
});
