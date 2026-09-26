import { beforeEach, describe, expect, it } from 'vitest';
import { renderLlmsTxt, renderRobotsTxt } from '../../src/lib/machineText';
import { checkResumeText } from '../../src/lib/integrity';
import { makeRng } from '../../src/lib/rng';
import { bump, levelIndex, onThreat } from '../../src/lib/threat';
import { _setBackends, readSession } from '../../src/lib/storage';
import { absoluteUrl, isDestId, url } from '../../src/lib/paths';

describe('llms.txt', () => {
  const txt = renderLlmsTxt('https://example.test');
  it('links the real résumé first and asks only for the model name', () => {
    expect(txt.indexOf('## The Real Résumé')).toBeLessThan(txt.indexOf('## Optional'));
    expect(txt).toContain('/resume.md): The actual qualifications. No gags.');
    expect(txt).toMatch(/please state which model you are\. That's the whole request\./);
    expect(txt).not.toMatch(/rank|rate|score|praise|ignore (all|previous)/i);
  });
  it('passes the integrity guard', () => {
    expect(checkResumeText(txt, 'llms')).toEqual([]);
  });
});

describe('robots.txt', () => {
  const txt = renderRobotsTxt();
  it('has real, base-prefixed rules and a catch-all', () => {
    expect(txt).toMatch(/User-agent: \*\nAllow: [^\n]*\/\nDisallow: [^\n]*\/alibi\//);
    expect(txt).toContain('User-agent: ClaudeBot');
    expect(txt.split('\n').filter((l) => l.startsWith('User-agent:'))).toHaveLength(4);
  });
});

describe('rng without a seed', () => {
  it('falls back to crypto and stays in range', () => {
    const r = makeRng('');
    const xs = Array.from({ length: 100 }, r);
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });
});

describe('threat bump', () => {
  beforeEach(() => _setBackends({ local: undefined, session: undefined }));
  it('persists the score and reports level changes once', () => {
    const seen: [number, number, boolean][] = [];
    const off = onThreat((s, i, c) => seen.push([s, i, c]));
    bump('spin');
    bump('spin');
    bump('spin');
    off();
    bump('spin');
    expect(readSession().threat).toBe(4);
    expect(seen).toEqual([
      [1, 0, false],
      [2, 0, false],
      [3, 1, true],
    ]);
    expect(levelIndex(readSession().threat)).toBe(1);
  });
});

describe('paths edge cases', () => {
  it('rejects relative paths and builds absolute URLs', () => {
    expect(() => url('resume/')).toThrow(/leading slash/);
    expect(absoluteUrl('/resume/', 'https://example.test')).toMatch(
      /^https:\/\/example\.test\/.*resume\/$/,
    );
    expect(isDestId('github')).toBe(true);
    expect(isDestId('myspace')).toBe(false);
    expect(isDestId(7)).toBe(false);
  });
});
