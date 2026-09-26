/** Machine-readable surfaces are plain: the facts and the links, nothing addressed to agents. */
import { describe, expect, it } from 'vitest';
import { renderLlmsTxt, renderRobotsTxt } from '../../src/lib/machineText';
import { checkResumeText } from '../../src/lib/integrity';
import { absoluteUrl, url } from '../../src/lib/paths';

describe('llms.txt', () => {
  const txt = renderLlmsTxt('https://example.test');
  it('is an index of the résumé in every format, and asks nothing of anyone', () => {
    for (const p of ['/resume/', '/resume.md', '/resume.pdf', '/resume-emb.pdf', '/projects/'])
      expect(txt).toContain(absoluteUrl(p, 'https://example.test'));
    expect(txt).not.toMatch(/please|which model|AI agents|ignore (all|previous)|instructions/i);
  });
  it('passes the integrity guard', () => {
    expect(checkResumeText(txt, 'llms')).toEqual([]);
  });
});

describe('robots.txt', () => {
  it('allows everything, plainly', () => {
    expect(renderRobotsTxt()).toMatch(/^User-agent: \*\nAllow: [^\n]*\/\n$/);
  });
});

describe('paths edge cases', () => {
  it('rejects relative paths and builds absolute URLs', () => {
    expect(() => url('resume/')).toThrow(/leading slash/);
    expect(absoluteUrl('/resume/', 'https://example.test')).toMatch(
      /^https:\/\/example\.test\/.*resume\/$/,
    );
  });
});
