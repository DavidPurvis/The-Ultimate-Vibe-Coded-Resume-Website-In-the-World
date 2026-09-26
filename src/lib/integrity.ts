/**
 * Résumé integrity guard — the Résumé Context Pack's §8 constraints, made executable.
 * Runs over the rendered résumé HTML text, the PDF text layer, resume.md, llms.txt, page metadata,
 * the /projects/ page and blog posts. Any violation fails tests / the build.
 */
import { ABSENT_TECH, GO_LANG, VERIFIED_NUMBERS } from '../content/facts';

export type Scope = 'resume' | 'pdf' | 'md' | 'llms' | 'meta' | 'projects' | 'blog';

export interface Violation {
  rule: string;
  match: string;
  index: number;
}

/** Blog posts get the claim rules (no invented tech, titles or honors), not the number whitelist. */
const ALL: readonly Scope[] = ['resume', 'pdf', 'md', 'llms', 'meta', 'projects', 'blog'];
const RESUME_LIKE: readonly Scope[] = ['resume', 'pdf', 'md'];

/** Numbers allowed per scope in addition to VERIFIED_NUMBERS and years. */
const EXTRA_NUMBERS: Partial<Record<Scope, readonly string[]>> = {
  // Python version in P1's known-issue sentence.
  projects: ['3.14'],
};

/** Collapse typographic variants so rules see one canonical string. */
export function canonicalize(text: string): string {
  return text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/ /g, ' ')
    .replace(/[ \t]+/g, ' ');
}

/** Normalise a matched numeric token for whitelist comparison ("~125" → "125", "1000" → "1,000"). */
export function normalizeNumber(token: string): string {
  let t = token.trim().replace(/^~/, '');
  if (/^\d{4,}$/.test(t)) t = Number(t).toLocaleString('en-US');
  return t;
}

const YEAR = /^(19|20)\d{2}$/;

function isAllowedNumber(token: string, scope: Scope, context: string): boolean {
  if (YEAR.test(token.trim())) return true;
  const n = normalizeNumber(token);
  if (VERIFIED_NUMBERS.includes(n)) return true;
  if ((EXTRA_NUMBERS[scope] ?? []).includes(n)) return true;
  // "May 12, 2023" graduation date (pack §3) — the only day-of-month that exists.
  if (n === '12' && /May 12, 2023/.test(context)) return true;
  return false;
}

interface Rule {
  id: string;
  scopes: readonly Scope[];
  check(text: string, scope: Scope): Violation[];
}

function matchAll(re: RegExp, text: string, rule: string): Violation[] {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const g = new RegExp(re.source, flags);
  return [...text.matchAll(g)].map((m) => ({ rule, match: m[0], index: m.index ?? 0 }));
}

const RULES: Rule[] = [
  {
    id: 'R1',
    scopes: ALL,
    check: (t) => matchAll(/\bsumma\b/i, t, 'R1'),
  },
  {
    id: 'R1b',
    scopes: RESUME_LIKE,
    check: (t) =>
      /Magna Cum Laude/.test(t)
        ? []
        : [{ rule: 'R1b', match: 'Magna Cum Laude missing', index: 0 }],
  },
  {
    id: 'R2',
    scopes: ALL,
    check: (t, scope) => {
      const out: Violation[] = [];
      for (const line of t.split('\n')) {
        if (/C Spire/.test(line) && /devops/i.test(line)) {
          out.push({ rule: 'R2', match: line.trim(), index: t.indexOf(line) });
        }
      }
      if (/devops\s+intern/i.test(t)) out.push({ rule: 'R2', match: 'DevOps intern', index: 0 });
      if (
        RESUME_LIKE.includes(scope) &&
        /C Spire/.test(t) &&
        !/Software Developer Intern, Fiber Billing/.test(t)
      ) {
        out.push({ rule: 'R2', match: 'C Spire title missing', index: 0 });
      }
      return out;
    },
  },
  {
    id: 'R3',
    scopes: ALL,
    check: (t) =>
      matchAll(/\b(?:opnsense|vlans?|dns filtering|wireguard|sqm|cake shaping)\b/i, t, 'R3'),
  },
  {
    id: 'R4',
    scopes: ALL,
    check: (t) => matchAll(/\bevdev\b|movement[- ]physics/i, t, 'R4'),
  },
  {
    id: 'R5',
    scopes: ALL,
    check: (t) => {
      const out: Violation[] = [];
      for (const m of t.matchAll(/car thing/gi)) {
        const i = m.index ?? 0;
        const window = t.slice(Math.max(0, i - 200), i + 200);
        const bad = window.match(/\b(?:deployed|running|in daily use|in production)\b/i);
        if (bad) out.push({ rule: 'R5', match: bad[0], index: i });
      }
      return out;
    },
  },
  {
    id: 'R6',
    scopes: ALL,
    check: (t) => [
      ...matchAll(/\b(?:calculus iii|physics ii)\b/i, t, 'R6'),
      ...matchAll(/\(\s*[ABCDF][+-]?\s*\)/, t, 'R6'),
      ...matchAll(/\bgrade[sd]?:?\s+[ABCDF][+-]?\b/i, t, 'R6'),
    ],
  },
  {
    id: 'R7',
    scopes: RESUME_LIKE,
    check: (t) => {
      const out: Violation[] = [];
      const edu = t.search(/\bEducation\b/);
      for (const m of t.matchAll(/\bC\b(?!\+\+|#|\s+Spire)|\bassembly\b|\bPIC24\b/g)) {
        const i = m.index ?? 0;
        const inEducation = edu >= 0 && i > edu;
        const labelled = /\(coursework\)/i.test(t.slice(i, i + 40));
        if (!inEducation && !labelled) out.push({ rule: 'R7', match: m[0], index: i });
      }
      return out;
    },
  },
  {
    id: 'R8',
    scopes: ['resume', 'pdf', 'md', 'meta', 'projects', 'llms'],
    check: (t, scope) => {
      const out: Violation[] = [];
      // Skip digits glued to words/emails/handles (e.g. "purvis647", "dgp0", "PIC24").
      const re = /(?<![A-Za-z0-9_@])~?\$?\d[\d,]*(?:\.\d+)?(?:x\d+|K|\+)?(?![A-Za-z0-9_@])/g;
      for (const m of t.matchAll(re)) {
        const tok = m[0].replace(/,$/, '');
        const i = m.index ?? 0;
        const ctx = t.slice(Math.max(0, i - 10), i + 20);
        if (!isAllowedNumber(tok, scope, ctx)) out.push({ rule: 'R8', match: tok, index: i });
      }
      return out;
    },
  },
  {
    id: 'R9',
    scopes: RESUME_LIKE,
    check: (t) => {
      const out: Violation[] = [];
      if (!/Salesforce Administrator/.test(t))
        out.push({ rule: 'R9', match: 'Salesforce Administrator missing', index: 0 });
      if (!/IT Support Specialist/.test(t))
        out.push({ rule: 'R9', match: 'IT Support Specialist missing', index: 0 });
      out.push(...matchAll(/(?:software|platform) engineer\s*[—-]\s*City of Aspen/i, t, 'R9'));
      return out;
    },
  },
  {
    id: 'R10',
    scopes: ALL,
    check: (t) => [...matchAll(ABSENT_TECH, t, 'R10'), ...matchAll(GO_LANG, t, 'R10')],
  },
  {
    id: 'R11',
    scopes: ALL,
    check: (t) => matchAll(/\[(?:EMAIL|PHONE|USERNAME)\]/, t, 'R11'),
  },
  {
    id: 'R12',
    scopes: ['resume', 'pdf', 'md', 'llms'],
    check: (t) => matchAll(/\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/, t, 'R12'),
  },
];

/** Check a block of text against every rule applicable to `scope`. */
export function checkResumeText(text: string, scope: Scope): Violation[] {
  const t = canonicalize(text);
  return RULES.filter((r) => r.scopes.includes(scope)).flatMap((r) => r.check(t, scope));
}

/** Subset used for grounded joke copy (copy that cites blockRefs). */
export function checkGroundedCopy(text: string): Violation[] {
  const t = canonicalize(text);
  const rules = RULES.filter((r) => ['R3', 'R4', 'R5', 'R8', 'R10', 'R11'].includes(r.id));
  return rules.flatMap((r) => r.check(t, 'meta'));
}

export function formatViolations(v: Violation[]): string {
  return v.map((x) => `  ${x.rule}: "${x.match}" @${x.index}`).join('\n');
}
