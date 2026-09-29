/** One CSP source for every page, one for the DOOM engine frame, and two tiny boot scripts (S1). */
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import { buildCsp, ENGINE_CSP } from '../../src/lib/csp';
import { BOOT_RESUME, BOOT_SITE } from '../../src/lib/boot';

describe('buildCsp', () => {
  const csp = buildCsp('abc=');

  it('pins exactly the given boot hash and allows nothing inline or evaluated', () => {
    expect(csp).toContain("script-src 'self' 'sha256-abc='");
    expect(csp).not.toMatch(/unsafe-|wasm-unsafe-eval/);
  });

  it('never talks to anyone else', () => {
    const directives = Object.fromEntries(
      csp.split('; ').map((d) => [d.split(' ')[0], d.split(' ').slice(1)]),
    );
    expect(directives['default-src']).toEqual(["'self'"]);
    expect(directives['connect-src']).toEqual(["'self'"]);
    expect(directives['form-action']).toEqual(["'none'"]);
    expect(directives['object-src']).toEqual(["'none'"]);
  });
});

describe('ENGINE_CSP', () => {
  it('is exactly the policy public/doom-engine/play.html carries', () => {
    const html = readFileSync('public/doom-engine/play.html', 'utf8');
    const m = /http-equiv="Content-Security-Policy"\s+content="([^"]+)"/.exec(html);
    expect(m?.[1]).toBe(ENGINE_CSP);
    expect(ENGINE_CSP).toContain("'wasm-unsafe-eval'");
  });
});

describe('boot scripts', () => {
  it('the résumé boot touches no storage: the résumé never reads the case', () => {
    expect(BOOT_RESUME).not.toMatch(/Storage|uvcr/);
    expect(BOOT_RESUME.length).toBeLessThan(80);
  });

  it('the site boot only reads preferences, and never writes or sends anything', () => {
    expect(BOOT_SITE).not.toMatch(/setItem|removeItem|sessionStorage/);
    expect(BOOT_SITE).not.toMatch(/fetch|XMLHttpRequest|sendBeacon/);
  });

  /** Run the boot script against a fake <html> with the given prefs, query and markers. */
  function boot(prefs: unknown, search = '', attrs: Record<string, string> = {}) {
    const set = new Map<string, string>(Object.entries(attrs));
    const documentElement = {
      setAttribute: (k: string, v: string) => set.set(k, v),
      getAttribute: (k: string) => set.get(k) ?? null,
      hasAttribute: (k: string) => set.has(k),
    };
    runInNewContext(BOOT_SITE, {
      document: { documentElement },
      localStorage: { getItem: () => (prefs === undefined ? null : JSON.stringify(prefs)) },
      location: { search },
      URLSearchParams,
    });
    return Object.fromEntries(set);
  }

  it('applies the saved mode and display setting before first paint', () => {
    expect(boot(undefined)).toEqual({ 'data-js': '', 'data-mode': 'chaos' });
    expect(boot({ mode: 'chaos', theme: 'comic' })).toMatchObject({ 'data-theme': 'comic' });
    expect(boot({ theme: 'system' })).not.toHaveProperty('data-theme');
    expect(boot({ theme: 'neon' })).not.toHaveProperty('data-theme');
    expect(boot({ theme: 'dark' }, '?mode=recruiter')).toEqual({
      'data-js': '',
      'data-mode': 'recruiter',
    });
    expect(boot({ mode: 'recruiter', theme: 'dark' }, '?mode=chaos')).toMatchObject({
      'data-mode': 'chaos',
      'data-theme': 'dark',
    });
  });

  it('the tribute never takes a novelty theme', () => {
    expect(boot({ theme: 'lights-out' }, '', { 'data-plain': '' })).not.toHaveProperty(
      'data-theme',
    );
  });
});
