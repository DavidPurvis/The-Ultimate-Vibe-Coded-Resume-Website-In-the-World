import { describe, expect, it } from 'vitest';
import {
  education,
  experience,
  projects,
  selection,
  skills,
  summary,
} from '../../src/content/resume';
import { FACTS } from '../../src/content/facts';
import { renderResumeText } from '../../src/lib/resumeText';

const bullets = [...experience.flatMap((r) => r.bullets), ...projects.flatMap((p) => p.bullets)];
const VERBS = [
  'Served',
  'Designed',
  'Migrated',
  'Led',
  'Automated',
  'Developed',
  'Built',
  'Repurposed',
];

describe('résumé data (GEN composition)', () => {
  it('experience is reverse-chronological', () => {
    const starts = experience.map((r) => r.start);
    expect([...starts].sort().reverse()).toEqual(starts);
  });

  it('every bullet starts with a past-tense verb (pack formatting rule)', () => {
    for (const b of bullets) {
      const first = b.text.split(' ')[0] ?? '';
      expect(VERBS, b.text).toContain(first);
    }
  });

  it('no first-person pronouns, no leading articles', () => {
    const text = renderResumeText();
    expect(text).not.toMatch(/\b(I|me|my|mine|we|our)\b/);
    for (const b of bullets) expect(b.text).not.toMatch(/^(A|An|The)\s/);
  });

  it('every bullet traces to a block with a FACT line', () => {
    for (const b of [...bullets, summary, ...education]) {
      expect(Object.keys(FACTS)).toContain(b.block);
    }
  });

  it('titles of record are exact', () => {
    const titles = experience.map((r) => r.title);
    expect(titles).toEqual([
      'Salesforce Administrator',
      'IT Support Specialist',
      'Whitewater Rafting Guide / Instructor',
      'Software Developer Intern, Fiber Billing',
    ]);
  });

  it('keeps the non-negotiable blocks (identity, degree + honors, A2, C1)', () => {
    const blocks = bullets.map((b) => b.block);
    expect(blocks).toContain('A2');
    expect(blocks).toContain('C1');
    expect(education.map((e) => e.line).join(' ')).toContain('Magna Cum Laude');
  });

  it('skills are S3 verbatim, four lines', () => {
    expect(skills.map((s) => s.label)).toEqual([
      'Languages',
      'Infrastructure',
      'Platforms',
      'Practices',
    ]);
  });

  it('standard section names appear in GEN order', () => {
    const text = renderResumeText();
    const order = ['Summary', 'Experience', 'Projects', 'Technical Skills', 'Education'].map((s) =>
      text.indexOf(`\n${s}\n`),
    );
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('Car Thing is described as built/packaged only', () => {
    const p1 = projects.find((p) => p.id === 'P1');
    expect(p1?.bullets[0]?.text).not.toMatch(/deployed|running|daily use|production/i);
  });

  it('selection report has no unfilled placeholders', () => {
    expect(Object.values(selection.placeholders).join(' ')).not.toMatch(
      /\[(EMAIL|PHONE|USERNAME)\]/,
    );
  });
});
