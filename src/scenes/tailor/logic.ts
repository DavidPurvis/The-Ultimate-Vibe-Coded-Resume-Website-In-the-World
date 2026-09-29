/**
 * Résumé For You™: pick the lane cut that fits the visitor's answers, and build the message the
 * Claude link pre-fills. Pure and unit-tested; the page never sends anything anywhere itself.
 */
import type { LaneId } from '../../content/resume/resolve';

export type Family = 'emb' | 'plt' | 'be' | 'gen' | 'fan';
export type Focus = 'hardware' | 'ownership' | 'data' | 'debugging' | 'vibes';

export interface TailorAnswers {
  family?: Family | undefined;
  focus?: Focus | undefined;
  summary?: 'yes' | 'no' | undefined;
  jd?: string | undefined;
}

/** The lane text the prompt carries, plus how to name it. */
export interface LaneForPrompt {
  label: string;
  url: string;
  text: string;
}

/** Longest job description the quiz accepts (the textarea's maxlength). */
export const JD_MAX = 3000;
/** Keep the pre-filled link comfortably inside what browsers and servers accept. */
export const URL_MAX = 8000;

const FOCUS_LANE: Record<Focus, LaneId> = {
  hardware: 'emb',
  debugging: 'emb',
  ownership: 'plt',
  data: 'be',
  vibes: 'gen',
};

/** The role family decides; "I just like the website" (or no answer) defers to what matters most. */
export function pickLane(a: TailorAnswers): LaneId {
  if (a.family && a.family !== 'fan') return a.family;
  return a.focus ? FOCUS_LANE[a.focus] : 'gen';
}

export const RULES = [
  'Use only the facts in the résumé below. Do not invent employers, job titles, numbers, dates or technologies.',
  'Keep the job titles exactly as written.',
  'Keep coursework-only skills labelled as coursework.',
  'Keep it to one page.',
] as const;

export interface PromptLabels {
  family: Partial<Record<Family, string>>;
  focus: Partial<Record<Focus, string>>;
}

/**
 * The message Claude receives. `jd` is used as given (callers cap and truncate it); everything
 * else, including the résumé, gets plain-ASCII typography to keep the link short.
 */
export function buildPrompt(
  a: TailorAnswers,
  lane: LaneForPrompt,
  labels: PromptLabels,
  jd = (a.jd ?? '').trim(),
): string {
  const head = ['I’m hiring and want David Purvis’s résumé tailored to the role.', ''];
  if (a.family && labels.family[a.family]) head.push(`Role: ${labels.family[a.family]}`);
  if (a.focus && labels.focus[a.focus]) head.push(`What matters most: ${labels.focus[a.focus]}`);
  if (a.summary) head.push(`Open with a summary: ${a.summary === 'yes' ? 'yes' : 'no'}`);
  head.push('');
  const tail = [
    '',
    'Rules:',
    ...RULES.map((r) => `- ${r}`),
    'After the résumé, list the three strongest matches for this role and any honest gaps.',
    '',
    `David’s résumé (${lane.label} cut, ${lane.url}):`,
    '',
    lane.text,
  ];
  const fold = (lines: string[]) => asciiFold(lines.join('\n'));
  const middle = jd
    ? `${asciiFold('Job description:')}\n"""\n${jd}\n"""`
    : asciiFold('No job description provided. Tailor it to the role above.');
  return `${fold(head)}\n${middle}\n${fold(tail)}`;
}

/**
 * Plain-ASCII typography for the message: curly quotes, dashes, "·" and "é" cost 6-9 characters
 * each once URL-encoded. Wording and facts are unchanged.
 */
export function asciiFold(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/·/g, '|')
    .replace(/•/g, '-')
    .replace(/™/g, '')
    .replace(/\u00a0/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export const claudeUrl = (base: string, prompt: string): string =>
  `${base}?q=${encodeURIComponent(prompt)}`;

export interface Handoff {
  /** The full message (job description capped at JD_MAX), shown in the read-only box. */
  prompt: string;
  /** The link, with the job description shortened if the full message wouldn't fit. */
  href: string;
  truncated: boolean;
}

/**
 * Build the link, shortening only the job description (never the résumé or the rules) until the
 * URL fits in URL_MAX. Binary search on the job description's length.
 */
export function handoff(
  a: TailorAnswers,
  lane: LaneForPrompt,
  labels: PromptLabels,
  base: string,
  max = URL_MAX,
): Handoff {
  const jd = (a.jd ?? '').trim().slice(0, JD_MAX);
  const prompt = buildPrompt(a, lane, labels, jd);
  const full = claudeUrl(base, prompt);
  if (full.length <= max) return { prompt, href: full, truncated: false };
  const withJd = (n: number) =>
    claudeUrl(base, buildPrompt(a, lane, labels, n > 0 ? `${jd.slice(0, n).trimEnd()} […]` : ''));
  let lo = 0;
  let hi = jd.length - 1;
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    if (withJd(mid).length <= max) lo = mid;
    else hi = mid - 1;
  }
  return { prompt, href: withJd(lo), truncated: true };
}
