import { describe, expect, it } from 'vitest';
import { LANE_IDS, LANES, TAILORED_LANES, type LaneResume } from '../../src/content/lanes';
import * as gen from '../../src/content/resume';
import { FACTS } from '../../src/content/facts';
import { checkResumeText } from '../../src/lib/integrity';
import { renderResumeText } from '../../src/lib/resumeText';

const VERBS = [
  'Served',
  'Designed',
  'Migrated',
  'Led',
  'Automated',
  'Developed',
  'Built',
  'Repurposed',
  'Brought',
  'Isolated',
  'Introduced',
  'Assessed',
];

const bullets = (l: LaneResume) => [
  ...l.experience.flatMap((r) => r.bullets),
  ...l.projects.flatMap((p) => p.bullets),
];
const blocks = (l: LaneResume) => bullets(l).map((b) => b.block);

describe.each(LANE_IDS)('lane %s', (id) => {
  const lane = LANES[id];
  const text = renderResumeText(lane);

  it('passes the integrity guard as a page and as a PDF text layer', () => {
    expect(checkResumeText(text, 'resume')).toEqual([]);
    expect(checkResumeText(text, 'pdf')).toEqual([]);
  });

  it('traces every line to a block with a FACT line', () => {
    const all = [
      ...bullets(lane),
      ...(lane.summary ? [lane.summary] : []),
      ...lane.education,
      ...lane.education.flatMap((e) => e.notes ?? []),
    ];
    for (const b of all) expect(Object.keys(FACTS), b.block).toContain(b.block);
  });

  it('keeps role headers exactly as on record, reverse-chronological', () => {
    for (const r of lane.experience) {
      const g = gen.experience.find((x) => x.id === r.id);
      expect({ ...r, bullets: [] }).toEqual({ ...g, bullets: [] });
    }
    const starts = lane.experience.map((r) => r.start);
    expect([...starts].sort().reverse()).toEqual(starts);
    // R9: both Aspen titles of record always appear, even when a role keeps only its header.
    expect(lane.experience.map((r) => r.id)).toEqual(
      expect.arrayContaining(['aspen-sfa', 'aspen-it', 'cspire']),
    );
  });

  it('never cuts A2, C1, or the degree with honors (pack §9)', () => {
    expect(blocks(lane)).toEqual(expect.arrayContaining(['A2', 'C1']));
    expect(lane.education.map((e) => e.line).join(' ')).toContain('Magna Cum Laude');
  });

  it('starts every bullet with a past-tense verb, no pronouns or leading articles', () => {
    for (const b of bullets(lane)) {
      expect(VERBS, b.text).toContain(b.text.split(' ')[0]);
      expect(b.text).not.toMatch(/^(A|An|The)\s/);
    }
    expect(text).not.toMatch(/\b(I|me|my|mine|we|our)\b/);
  });

  it('labels coursework-only skills wherever they sit outside Education', () => {
    for (const s of lane.skills) {
      if (/\bC\b|\bJava\b|assembly|I2C|SPI|UART|logic design/.test(s.items))
        expect(s.items, s.label).toMatch(/coursework/);
    }
  });

  it('describes the Car Thing as built and packaged, never running', () => {
    for (const p of lane.projects.filter((x) => x.id === 'P1'))
      expect(p.bullets[0]?.text).not.toMatch(/deployed|running|daily use|production/i);
  });

  it('records what was selected and what was cut', () => {
    expect(lane.selection.selected.length).toBeGreaterThan(10);
    expect(lane.selection.cut.length).toBeGreaterThan(2);
  });
});

describe('lane compositions (pack §9)', () => {
  it('GEN is the résumé itself, so /resume/ cannot drift', () => {
    expect(LANES.gen.experience).toBe(gen.experience);
    expect(LANES.gen.projects).toBe(gen.projects);
    expect(LANES.gen.education).toBe(gen.education);
    expect(renderResumeText()).toBe(renderResumeText(LANES.gen));
  });

  it('orders sections the way the pack recommends', () => {
    expect(LANES.emb.order).toEqual(['summary', 'skills', 'education', 'projects', 'experience']);
    for (const id of ['gen', 'plt', 'be'] as const)
      expect(LANES[id].order).toEqual(['summary', 'experience', 'projects', 'skills', 'education']);
  });

  it('selects the lane projects', () => {
    expect(LANES.emb.projects.map((p) => p.id)).toEqual(['P1', 'P2', 'P3']);
    expect(LANES.plt.projects.map((p) => p.id)).toEqual(['P3', 'P2']);
    expect(LANES.be.projects.map((p) => p.id)).toEqual(['P3', 'P4']);
  });

  it('selects the lane experience bullets, after the documented cuts', () => {
    expect(blocks(LANES.emb).filter((b) => /^[A-D]\d/.test(b))).toEqual([
      'A1',
      'A2',
      'A3',
      'B1',
      'C1',
      'C2',
    ]);
    expect(blocks(LANES.plt).filter((b) => /^[A-D]\d/.test(b))).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'A6',
      'B1',
      'D1',
      'C1',
      'C2',
    ]);
    expect(blocks(LANES.be).filter((b) => /^[A-D]\d/.test(b))).toEqual([
      'A1',
      'A2',
      'A3',
      'D1',
      'C1',
      'C2',
    ]);
  });

  it('BE keeps the IT Support header with no bullets (pack §5.2)', () => {
    expect(LANES.be.experience.find((r) => r.id === 'aspen-it')?.bullets).toEqual([]);
  });

  it('drops the GPA only for PLT', () => {
    expect(renderResumeText(LANES.plt)).not.toContain('3.76');
    for (const id of ['gen', 'emb', 'be'] as const)
      expect(renderResumeText(LANES[id])).toContain('3.76 GPA');
  });

  it('adds the education lines each lane calls for', () => {
    const notes = (id: keyof typeof LANES) =>
      LANES[id].education.flatMap((e) => (e.notes ?? []).map((n) => n.block));
    expect(notes('emb')).toEqual(['E4', 'CW2']);
    expect(notes('plt')).toEqual(['E3']);
    expect(notes('be')).toEqual(['E3', 'CW4']);
    expect(notes('gen')).toEqual([]);
  });

  it('gives each tailored lane its own page and PDF', () => {
    expect(TAILORED_LANES).toEqual(['emb', 'plt', 'be']);
    for (const id of TAILORED_LANES) {
      expect(LANES[id].path).toBe(`/resume/for/${id}/`);
      expect(LANES[id].pdf).toBe(`resume-${id}.pdf`);
    }
    expect(LANES.gen.path).toBe('/resume/');
    expect(LANES.gen.pdf).toBe('resume.pdf');
  });
});
