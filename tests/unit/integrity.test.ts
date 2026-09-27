import { describe, expect, it } from 'vitest';
import { checkResumeText, checkGroundedCopy, normalizeNumber } from '../../src/lib/integrity';
import { renderResumeMarkdown, renderResumeText } from '../../src/lib/resumeText';
import { caseFiles } from '../../src/content/site/projects';

const rules = (text: string, scope: Parameters<typeof checkResumeText>[1] = 'meta') =>
  checkResumeText(text, scope).map((v) => v.rule);

describe('integrity fixtures — each violates exactly the named rule', () => {
  const cases: [string, string][] = [
    ['Graduated Summa Cum Laude', 'R1'],
    ['DevOps Intern — C Spire', 'R2'],
    ['Configured an OPNsense firewall', 'R3'],
    ['Wrote an evdev daemon', 'R4'],
    ['The Car Thing controller was deployed to production', 'R5'],
    ['Calculus III (D)', 'R6'],
    ['improved uptime by 40%', 'R8'],
    ['Built clusters on Kubernetes', 'R10'],
    ['Contact: [EMAIL]', 'R11'],
  ];
  for (const [text, rule] of cases) {
    it(`${rule}: ${text}`, () => {
      expect(rules(text)).toContain(rule);
    });
  }
  it('R7: C without (coursework) outside Education', () => {
    expect(rules('Languages: C, Python\nEducation', 'resume')).toContain('R7');
  });
  it('R7: C labelled (coursework) is fine; C Spire never triggers', () => {
    const r = rules('Languages: C (coursework), Python\nC Spire\nEducation', 'resume');
    expect(r).not.toContain('R7');
  });
  it('R9: restyled title', () => {
    expect(rules('Platform Engineer — City of Aspen', 'resume')).toContain('R9');
  });
  it('R12: phone number', () => {
    expect(rules('Call (555) 123-4567', 'resume')).toContain('R12');
  });
  it('Go the language is flagged; "Go home" is not', () => {
    expect(rules('Wrote services in Go')).toContain('R10');
    expect(rules('Go home')).not.toContain('R10');
  });
});

describe('number normalisation', () => {
  it('handles ~, thousands and years', () => {
    expect(normalizeNumber('~125')).toBe('125');
    expect(normalizeNumber('1000')).toBe('1,000');
    expect(rules('Apr 2025 – May 2026', 'resume')).not.toContain('R8');
    expect(rules('graduated May 12, 2023', 'meta')).not.toContain('R8');
  });
  it('ignores digits glued to handles and emails', () => {
    expect(rules('davidpurvis647@gmail.com · linkedin.com/in/dgp0')).not.toContain('R8');
  });
});

describe('the real résumé', () => {
  it('rendered text has zero violations', () => {
    expect(checkResumeText(renderResumeText(), 'resume')).toEqual([]);
  });
  it('markdown has zero violations', () => {
    expect(checkResumeText(renderResumeMarkdown('https://example.test/resume.pdf'), 'md')).toEqual(
      [],
    );
  });
  it('case files page copy has zero violations', () => {
    const text = caseFiles
      .map((c) => [c.name, c.stack, ...c.body, c.knownIssue ?? ''].join('\n'))
      .join('\n');
    expect(checkResumeText(text, 'projects')).toEqual([]);
  });
  it('3.14 is only allowed on the projects page', () => {
    expect(rules('Python 3.14', 'projects')).not.toContain('R8');
    expect(rules('Python 3.14', 'resume')).toContain('R8');
  });
  it('grounded copy check passes verified numbers', () => {
    expect(checkGroundedCopy('Deployed 150+ workstations')).toEqual([]);
    expect(checkGroundedCopy('Deployed 400 workstations').map((v) => v.rule)).toContain('R8');
  });
});
