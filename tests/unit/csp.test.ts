/** One CSP source for every page, one for the DOOM engine frame, and two tiny boot scripts (S1). */
import { readFileSync } from 'node:fs';
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

  it('the site boot reads only the case hint (and the legacy prefs until P4B)', () => {
    expect(BOOT_SITE).toContain("sessionStorage.getItem('uvcr:case')");
    expect(BOOT_SITE).not.toMatch(/setItem|removeItem/);
    expect(BOOT_SITE).not.toMatch(/fetch|XMLHttpRequest|sendBeacon/);
  });
});
