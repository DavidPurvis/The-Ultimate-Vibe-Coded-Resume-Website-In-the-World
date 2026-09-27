/**
 * The résumé's content model: Fact → Framing → Composition.
 *
 *   Fact         a verified claim from the Résumé Context Pack (its FACT line), with its source
 *   Framing      one way of wording a fact for a résumé line; it may not add numbers or technology
 *   Composition  which framings a lane uses, in which order (one per lane)
 *
 * resolve() turns a composition into the render model below (LaneResume), which the résumé pages,
 * the PDFs, resume.md and llms.txt consume. validate() proves every rendered line traces to a fact.
 */
import type { LaneId, LaneMeta } from '../laneIndex';

export type { LaneId };

/** Block IDs from the Résumé Context Pack. */
export type BlockId =
  | 'ID'
  | 'SUM-GEN'
  | 'SUM-EMB-SHORT'
  | 'SUM-PLT'
  | 'SUM-BE'
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'A5'
  | 'A6'
  | 'B1'
  | 'C1'
  | 'C2'
  | 'D1'
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  /** Coursework lines. The pack calls these C2 and C4, which collide with the C Spire bullets. */
  | 'CW2'
  | 'CW4'
  | 'P1'
  | 'P2'
  | 'P3'
  | 'P4'
  | 'S2'
  | 'S3'
  | 'S4'
  | 'SK-linux'
  | 'SK-git';

export type RoleId = 'aspen-sfa' | 'aspen-it' | 'cspire' | 'rafting';
export type ProjectId = 'P1' | 'P2' | 'P3' | 'P4';
/** `${block}:${first lane that used this wording}`, e.g. 'A2:gen', 'A2:emb'. */
export type FramingId = `${BlockId}:${string}`;
export type SectionKey = 'summary' | 'experience' | 'projects' | 'skills' | 'education';

export type SourceRef =
  | { readonly doc: 'resume-context-pack'; readonly section: string }
  | { readonly doc: 'david'; readonly date: string; readonly note: string };

export interface Fact {
  readonly id: BlockId;
  /** The pack's FACT line, verbatim. */
  readonly claim: string;
  readonly source: SourceRef;
  readonly kind:
    'identity' | 'summary' | 'role-bullet' | 'project' | 'skills' | 'education' | 'coursework';
  readonly role?: RoleId;
  readonly project?: ProjectId;
}

export interface Framing {
  readonly id: FramingId;
  readonly fact: BlockId;
  readonly text: string;
  /** 'pack': the pack's own wording for this lane; 'adapted': rewritten here, with the reason. */
  readonly origin: 'pack' | 'adapted';
  readonly why?: string;
}

export interface RoleOfRecord {
  readonly id: RoleId;
  readonly title: string;
  readonly org: string;
  readonly location: string;
  readonly dates: string;
  /** YYYY-MM, for the reverse-chronological check. */
  readonly start: string;
}

export interface ProjectOfRecord {
  readonly id: ProjectId;
  readonly anchor: string;
  readonly name: string;
  readonly stack: string;
}

export interface Composition {
  readonly lane: LaneId;
  readonly order: readonly SectionKey[];
  readonly summary: FramingId | null;
  readonly roles: readonly { readonly role: RoleId; readonly bullets: readonly FramingId[] }[];
  readonly projects: readonly {
    readonly project: ProjectId;
    readonly bullets: readonly FramingId[];
  }[];
  readonly skills: readonly { readonly label: string; readonly framing: FramingId }[];
  readonly education: readonly {
    readonly fact: 'E1' | 'E2';
    readonly variant: 'full' | 'no-gpa';
    readonly notes: readonly FramingId[];
  }[];
}

export interface Selection {
  readonly selected: readonly string[];
  readonly cut: readonly { readonly block: string; readonly reason: string }[];
}

/* ---------- the render model (unchanged shape from before the content model) ---------- */

export interface Bullet {
  block: BlockId;
  text: string;
}
export interface Role {
  id: RoleId;
  title: string;
  org: string;
  location: string;
  dates: string;
  start: string;
  bullets: Bullet[];
}
export interface Project {
  id: ProjectId;
  anchor: string;
  name: string;
  stack: string;
  bullets: Bullet[];
}
export interface SkillLine {
  label: string;
  items: string;
}
export interface EducationEntry {
  block: BlockId;
  school: string;
  line: string;
  /** Extra lines under the entry (coursework, major history). */
  notes?: Bullet[];
}
export interface LaneResume extends LaneMeta {
  id: LaneId;
  order: readonly SectionKey[];
  summary: Bullet | null;
  experience: Role[];
  projects: Project[];
  skills: SkillLine[];
  education: EducationEntry[];
  selection: Selection;
}
