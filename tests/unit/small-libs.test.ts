import { describe, expect, it } from 'vitest';
import { makeRng, mulberry32, seedFrom } from '../../src/lib/rng';
import { level, levelIndex, POINTS } from '../../src/lib/threat';
import { formatPhone, formatTimeLocal, PHONE_MAX } from '../../src/lib/format';
import { parseModeParam } from '../../src/lib/mode';
import { armPlayful, eligible, isPlainActivation } from '../../src/lib/links';
import { DEST, entityEncode, url } from '../../src/lib/paths';
import { KONAMI, isEditableTarget, matches, pushKey } from '../../src/scenes/konami/logic';
import { CYCLE, effective, nextTheme } from '../../src/scenes/theme/logic';
import { nextPosition, shouldDodge } from '../../src/scenes/runaway/logic';

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
    expect(makeRng('?seed=7')()).toBe(mulberry32(7)());
  });
});

describe('threat', () => {
  it('level boundaries', () => {
    expect([0, 2.5, 3, 6.5, 7, 11.5, 12, 99].map(levelIndex)).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
    expect(level(12)).toBe('PLEASE HIRE HIM SO HE STOPS');
    expect(POINTS.bannerRemoved).toBe(5);
  });
});

describe('format', () => {
  it('formats phone numbers with padding and clamping', () => {
    expect(formatPhone(0)).toBe('(000) 000-0000');
    expect(formatPhone(5551234567)).toBe('(555) 123-4567');
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
  it('accepts only the two modes', () => {
    expect(parseModeParam('?mode=recruiter')).toBe('recruiter');
    expect(parseModeParam('?mode=chaos')).toBe('chaos');
    expect(parseModeParam('?mode=hr')).toBeNull();
    expect(parseModeParam('')).toBeNull();
  });
});

const link = (attrs: Record<string, string>) => ({
  hasAttribute: (n: string) => n in attrs,
  getAttribute: (n: string) => attrs[n] ?? null,
});

describe('playful links', () => {
  it('eligibility excludes exits, destinations, résumé and casino', () => {
    expect(eligible(link({ 'data-playful': '', href: '/x/about/' }))).toBe(true);
    expect(eligible(link({ href: '/x/about/' }))).toBe(false);
    expect(eligible(link({ 'data-playful': '', 'data-escape': '', href: '/x/about/' }))).toBe(
      false,
    );
    expect(
      eligible(link({ 'data-playful': '', 'data-dest': 'github', href: '/x/casino/?dest=github' })),
    ).toBe(false);
    expect(eligible(link({ 'data-playful': '', href: '/x/resume/' }))).toBe(false);
    expect(eligible(link({ 'data-playful': '', href: '/x/casino/' }))).toBe(false);
    expect(eligible(link({ 'data-playful': '', href: '/x/about/', target: '_blank' }))).toBe(false);
  });
  it('arms with p = 0.25 and never right after a rickroll', () => {
    const ls = [
      link({ 'data-playful': '', href: '/a/' }),
      link({ 'data-playful': '', href: '/b/' }),
    ];
    const samples = [0.2499, 0.25];
    expect(armPlayful(ls, () => samples.shift() ?? 1, false)).toEqual([ls[0]]);
    expect(armPlayful(ls, () => 0, true)).toEqual([]);
  });
  it('plain activation truth table', () => {
    const base = { button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false };
    expect(isPlainActivation(base)).toBe(true);
    expect(isPlainActivation({ ...base, button: 1 })).toBe(false);
    for (const k of ['metaKey', 'ctrlKey', 'shiftKey', 'altKey'] as const) {
      expect(isPlainActivation({ ...base, [k]: true })).toBe(false);
    }
    expect(isPlainActivation({ ...base, defaultPrevented: true })).toBe(false);
  });
});

describe('paths', () => {
  it('prefixes the base and keeps query/hash', () => {
    expect(url('/resume/')).toMatch(/\/resume\/$/);
    expect(url('/casino/?dest=github#x')).toMatch(/\/casino\/\?dest=github#x$/);
    expect(() => url('resume/')).toThrow();
  });
  it('destinations are exact', () => {
    expect(DEST.github.href).toBe('https://github.com/DavidPurvis');
    expect(DEST.linkedin.href).toBe('https://www.linkedin.com/in/dgp0');
    expect(DEST.email.href).toBe('mailto:davidpurvis647@gmail.com');
    expect(DEST.pdf.href).toMatch(/resume\.pdf$/);
    expect(DEST.repo.href).toBe(
      'https://github.com/DavidPurvis/The-Ultimate-Vibe-Coded-Resume-Website-In-the-World',
    );
  });
  it('entity-encodes every character', () => {
    expect(entityEncode('a@b')).toBe('&#97;&#64;&#98;');
  });
});

describe('konami', () => {
  it('detects the sequence case-insensitively with a rolling buffer', () => {
    let buf: string[] = [];
    for (const k of ['x', 'ArrowUp', ...KONAMI.map((k) => (k === 'b' ? 'B' : k === 'a' ? 'A' : k))])
      buf = pushKey(buf, k);
    expect(buf).toHaveLength(10);
    expect(matches(buf)).toBe(true);
    expect(matches(pushKey(buf, 'c'))).toBe(false);
  });
  it('ignores editable targets', () => {
    expect(isEditableTarget({ tagName: 'input' })).toBe(true);
    expect(isEditableTarget({ tagName: 'TEXTAREA' })).toBe(true);
    expect(isEditableTarget({ tagName: 'DIV', isContentEditable: true })).toBe(true);
    expect(isEditableTarget({ tagName: 'BUTTON' })).toBe(false);
    expect(isEditableTarget(null)).toBe(false);
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

describe('runaway geometry', () => {
  const arena = { x: 0, y: 0, w: 600, h: 240 };
  const btn = { x: 240, y: 98, w: 120, h: 44 };
  it('moves away from the pointer along the vector', () => {
    const p = nextPosition(btn, { x: 260, y: 120 }, arena, 140, 90);
    expect(p.x).toBeGreaterThan(btn.x);
  });
  it('zero-distance fallback moves right', () => {
    const p = nextPosition(btn, { x: 300, y: 120 }, arena, 140, 10);
    expect(p.x).toBeGreaterThan(btn.x);
  });
  it('clamps into the arena with padding', () => {
    const p = nextPosition({ x: 470, y: 98, w: 120, h: 44 }, { x: 400, y: 120 }, arena, 300, 10);
    expect(p.x).toBe(600 - 120 - 8);
  });
  it('escapes to the farthest corner when cornered', () => {
    const cornered = { x: 472, y: 188, w: 120, h: 44 };
    const p = nextPosition(cornered, { x: 520, y: 200 }, arena, 140, 90);
    expect(p).toEqual({ x: 8, y: 8 });
  });
  it('one approach consumes one dodge, respecting cooldown', () => {
    expect(shouldDodge(false, true, 0, 1000, 250)).toBe(true);
    expect(shouldDodge(true, true, 0, 1000, 250)).toBe(false);
    expect(shouldDodge(false, true, 900, 1000, 250)).toBe(false);
    expect(shouldDodge(false, false, 0, 1000, 250)).toBe(false);
  });
});

describe('newsletter form numbers', () => {
  it('skip 7 like every other form', async () => {
    const { postFormId } = await import('../../src/lib/blog.pure');
    const ids = Array.from({ length: 12 }, (_, i) => postFormId(i));
    expect(ids.slice(0, 7)).toEqual([
      'DRV-28/01',
      'DRV-28/02',
      'DRV-28/03',
      'DRV-28/04',
      'DRV-28/05',
      'DRV-28/06',
      'DRV-28/08',
    ]);
    expect(ids.some((id) => /\/\d*7\d*$/.test(id))).toBe(false);
  });
});
