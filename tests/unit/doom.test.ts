import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  DOCK_SIZES,
  engineSrc,
  nextSize,
  parseMessage,
  progressPct,
} from '../../src/scenes/doom/logic';
import { PINNED } from '../../scripts/vendor-doom';

describe('DOOM player', () => {
  it('accepts only well-formed messages from the engine frame', () => {
    expect(parseMessage({ type: 'doom:ready' })).toEqual({ type: 'doom:ready' });
    expect(parseMessage({ type: 'doom:escape', extra: 1 })).toEqual({ type: 'doom:escape' });
    expect(parseMessage({ type: 'doom:progress', left: 1, total: 3 })).toEqual({
      type: 'doom:progress',
      left: 1,
      total: 3,
    });
    expect(parseMessage({ type: 'doom:progress', left: 'x', total: 3 })).toBeNull();
    expect(parseMessage({ type: 'doom:progress', left: -1, total: 3 })).toBeNull();
    expect(parseMessage({ type: 'doom:error' })).toEqual({ type: 'doom:error', reason: 'unknown' });
    expect(parseMessage({ type: 'doom:error', reason: 'load' })).toEqual({
      type: 'doom:error',
      reason: 'load',
    });
    for (const junk of [null, 'doom:ready', 42, {}, { type: 'rickroll' }])
      expect(parseMessage(junk)).toBeNull();
  });

  it('reports loading progress as a percentage', () => {
    expect(progressPct(0, 0)).toBe(0);
    expect(progressPct(3, 3)).toBe(0);
    expect(progressPct(1, 3)).toBe(67);
    expect(progressPct(0, 3)).toBe(100);
    expect(progressPct(9, 3)).toBe(0);
  });

  it('points the frame at this site, with sound as a flag', () => {
    expect(engineSrc('/base/', true)).toBe('/base/doom-engine/play.html?sound=1');
    expect(engineSrc('/base', false)).toBe('/base/doom-engine/play.html?sound=0');
    expect(engineSrc('/', false)).toBe('/doom-engine/play.html?sound=0');
  });

  it('cycles the dock through three sizes', () => {
    expect(DOCK_SIZES).toHaveLength(3);
    expect([0, 1, 2].map(nextSize)).toEqual([1, 2, 0]);
  });
});

describe('the DOOM engine frame', () => {
  const html = readFileSync('public/doom-engine/play.html', 'utf8');
  const boot = readFileSync('public/doom-engine/boot.js', 'utf8');

  it('is the only place WebAssembly may compile, and has no inline script', () => {
    expect(html).toMatch(/content="[^"]*script-src 'self' 'wasm-unsafe-eval'/);
    expect(html).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);
    expect(html).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>/);
    expect(html).toMatch(/connect-src 'self'/);
  });

  it('never connects to a server and hands the keyboard back on Shift+Esc', () => {
    expect(boot).not.toMatch(/-connect|-server\b/);
    expect(boot).toMatch(/e\.key === 'Escape' && e\.shiftKey/);
    expect(boot).toMatch(/postMessage\([^)]*location\.origin\)/);
  });

  it('vendors exactly the pinned engine and game files, and git ignores them', () => {
    expect(Object.keys(PINNED).sort()).toEqual(
      ['doom1.wad', 'websockets-doom.js', 'websockets-doom.wasm'].sort(),
    );
    for (const h of Object.values(PINNED)) expect(h).toMatch(/^[0-9a-f]{64}$/);
    const ignore = readFileSync('.gitignore', 'utf8');
    for (const f of Object.keys(PINNED)) expect(ignore).toContain(`public/doom-engine/${f}`);
  });
});
