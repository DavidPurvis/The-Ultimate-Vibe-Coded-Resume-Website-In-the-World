/**
 * Structural validation of the content model (F1, F2): every rendered line traces to a fact, adds
 * no number and no technology its fact doesn't carry, and sits where its fact belongs. It runs in
 * unit tests and at the start of postbuild, which fails the build on any violation.
 */
import { COMPOSITIONS } from './compositions';
import { FACTS } from './facts';
import { FRAMINGS } from './framings';
import { ABSENT_TECH, GO_LANG, GRANDFATHERED, TECH_TERMS, usesTerm } from './lexicon';
import { numberTokens, VERIFIED_NUMBERS, YEAR } from './numbers';
import { PROJECTS } from './projects';
import { ROLES } from './roles';
import type {
  BlockId,
  Composition,
  Fact,
  Framing,
  FramingId,
  LaneId,
  ProjectId,
  ProjectOfRecord,
  RoleId,
  RoleOfRecord,
} from './types';
import type { Grandfathered } from './lexicon';

export interface ContentModel {
  facts: Readonly<Record<BlockId, Fact>>;
  framings: Readonly<Record<FramingId, Framing>>;
  compositions: Readonly<Record<LaneId, Composition>>;
  roles: Readonly<Record<RoleId, RoleOfRecord>>;
  projects: Readonly<Record<ProjectId, ProjectOfRecord>>;
  grandfathered: readonly Grandfathered[];
}

export const CONTENT: ContentModel = {
  facts: FACTS,
  framings: FRAMINGS,
  compositions: COMPOSITIONS,
  roles: ROLES,
  projects: PROJECTS,
  grandfathered: GRANDFATHERED,
};

export interface StructuralViolation {
  rule: 'fact' | 'number' | 'term' | 'absent-tech' | 'placement' | 'reference' | 'order';
  where: string;
  detail: string;
}

export function validateContent(m: ContentModel = CONTENT): StructuralViolation[] {
  const out: StructuralViolation[] = [];
  const v = (rule: StructuralViolation['rule'], where: string, detail: string) =>
    out.push({ rule, where, detail });
  const allowed = (where: string, kind: Grandfathered['kind'], value: string) =>
    m.grandfathered.some((g) => g.where === where && g.kind === kind && g.value === value);
  const allClaims = Object.values(m.facts)
    .map((f) => f.claim)
    .join('\n');

  // Facts: every number in a FACT line is a verified number.
  for (const f of Object.values(m.facts))
    for (const n of numberTokens(f.claim))
      if (!YEAR.test(n) && !VERIFIED_NUMBERS.includes(n))
        v('number', f.id, `FACT line has unverified number ${n}`);

  // Framings: a real fact, a reason when adapted, nothing added.
  for (const f of Object.values(m.framings)) {
    const fact = m.facts[f.fact];
    if (!fact || !f.id.startsWith(`${f.fact}:`)) {
      v('fact', f.id, `framing of unknown or mismatched fact ${f.fact}`);
      continue;
    }
    if (f.origin === 'adapted' && !f.why) v('fact', f.id, 'adapted framing without a reason');
    const factNumbers = numberTokens(fact.claim);
    for (const n of numberTokens(f.text))
      if (!YEAR.test(n) && !factNumbers.includes(n) && !allowed(f.id, 'number', n))
        v('number', f.id, `number ${n} is not in FACT ${fact.id}`);
    const pool = fact.kind === 'skills' ? allClaims : fact.claim;
    for (const t of TECH_TERMS)
      if (usesTerm(f.text, t) && !usesTerm(pool, t) && !allowed(f.id, 'term', t))
        v(
          'term',
          f.id,
          `"${t}" is not in ${fact.kind === 'skills' ? 'any FACT line' : `FACT ${fact.id}`}`,
        );
    if (ABSENT_TECH.test(f.text) || GO_LANG.test(f.text))
      v('absent-tech', f.id, 'names a technology with no evidence');
  }

  // Project stacks may only name technology some fact carries.
  for (const p of Object.values(m.projects))
    for (const t of TECH_TERMS)
      if (usesTerm(p.stack, t) && !usesTerm(allClaims, t) && !allowed(`stack:${p.id}`, 'term', t))
        v('term', `stack:${p.id}`, `"${t}" is not in any FACT line`);

  // Compositions: references resolve, and every framing sits where its fact belongs.
  const kindOf = (id: FramingId) => {
    const f = m.framings[id];
    return f ? m.facts[f.fact] : undefined;
  };
  const expect = (lane: string, id: FramingId, ok: (f: Fact) => boolean, what: string) => {
    const fact = kindOf(id);
    if (!fact) v('reference', `${lane}:${id}`, 'unknown framing');
    else if (!ok(fact)) v('placement', `${lane}:${id}`, what);
  };
  for (const c of Object.values(m.compositions)) {
    if (new Set(c.order).size !== 5) v('order', c.lane, 'every section exactly once');
    if (c.summary) expect(c.lane, c.summary, (f) => f.kind === 'summary', 'summary slot');
    let last = '9999-99';
    for (const r of c.roles) {
      const role = m.roles[r.role];
      if (!role) {
        v('reference', `${c.lane}:${r.role}`, 'unknown role');
        continue;
      }
      if (role.start > last) v('order', `${c.lane}:${r.role}`, 'roles not reverse-chronological');
      last = role.start;
      for (const b of r.bullets)
        expect(c.lane, b, (f) => f.role === r.role, `belongs under ${kindOf(b)?.role ?? '?'}`);
    }
    for (const p of c.projects) {
      if (!m.projects[p.project]) v('reference', `${c.lane}:${p.project}`, 'unknown project');
      for (const b of p.bullets)
        expect(
          c.lane,
          b,
          (f) => f.project === p.project,
          `belongs under ${kindOf(b)?.project ?? '?'}`,
        );
    }
    for (const s of c.skills) expect(c.lane, s.framing, (f) => f.kind === 'skills', 'skills slot');
    for (const e of c.education)
      for (const n of e.notes)
        expect(
          c.lane,
          n,
          (f) => f.kind === 'education' || f.kind === 'coursework',
          'education notes slot',
        );
  }
  return out;
}
