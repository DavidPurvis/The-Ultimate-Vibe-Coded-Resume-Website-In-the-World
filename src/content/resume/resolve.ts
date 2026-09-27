/**
 * resolve(lane): a composition, made concrete. Role and project headers come only from ROLES and
 * PROJECTS; every line is a framing of a fact; education lines are the E1/E2 FACT lines themselves
 * (the PLT cut drops the GPA). The result is the render model every surface consumes.
 */
import { LANE_META } from '../laneIndex';
import { COMPOSITIONS } from './compositions';
import { FACTS } from './facts';
import { FRAMINGS } from './framings';
import { PROJECTS } from './projects';
import { ROLES } from './roles';
import { SELECTIONS } from './selections';
import type {
  Bullet,
  Composition,
  EducationEntry,
  FramingId,
  LaneId,
  LaneResume,
  SectionKey,
} from './types';

export type { LaneId, LaneResume } from './types';

function bullet(id: FramingId): Bullet {
  const f = FRAMINGS[id];
  if (!f) throw new Error(`unknown framing ${id}`);
  return { block: f.fact, text: f.text };
}

function education(e: Composition['education'][number]): EducationEntry {
  const [school = '', full = ''] = FACTS[e.fact].claim.split(' — ');
  const line = e.variant === 'no-gpa' ? full.replace(/ · 3\.76 GPA$/, '') : full;
  const entry: EducationEntry = { block: e.fact, school, line };
  if (e.notes.length) entry.notes = e.notes.map(bullet);
  return entry;
}

export function resolve(lane: LaneId, c: Composition = COMPOSITIONS[lane]): LaneResume {
  const sections: { [K in SectionKey]: () => unknown } = {
    summary: () => (c.summary ? bullet(c.summary) : null),
    experience: () => c.roles.map((r) => ({ ...ROLES[r.role], bullets: r.bullets.map(bullet) })),
    projects: () =>
      c.projects.map((p) => ({ ...PROJECTS[p.project], bullets: p.bullets.map(bullet) })),
    skills: () => c.skills.map((s) => ({ label: s.label, items: bullet(s.framing).text })),
    education: () => c.education.map(education),
  };
  // Sections are emitted in the lane's reading order.
  const body = Object.fromEntries(c.order.map((k) => [k, sections[k]()]));
  return {
    id: lane,
    ...LANE_META[lane],
    order: c.order,
    ...body,
    selection: SELECTIONS[lane],
  } as LaneResume;
}

export const LANE_IDS = Object.keys(COMPOSITIONS) as LaneId[];
export const LANES: Record<LaneId, LaneResume> = Object.fromEntries(
  LANE_IDS.map((l) => [l, resolve(l)]),
) as Record<LaneId, LaneResume>;
/** The three tailored cuts that get their own page (GEN is /resume/ itself). */
export const TAILORED_LANES = LANE_IDS.filter((l) => l !== 'gen');
