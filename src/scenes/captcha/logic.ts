/** CAPTCHAN'T™ as a pure reducer (plan §9.7): authored rejections, bounded failure, Linux reversal. */
import type { CaptchaTile } from '../../content/copy/captcha';

export const MAX_ROUND_REJECTIONS = 3;
export const MAX_TOTAL_REJECTIONS = 6;

export type Round = 'windows' | 'cage' | 'linux';
export type WindowCategory = 'none' | 'software-only' | 'physical-only' | 'all' | 'mixed';
export type CageCategory = 'none' | 'all' | 'some';
export type Method = 'linux' | 'audio';

export interface Copy {
  windows: { headlines: Record<WindowCategory, string>; sublines: readonly string[] };
  cage: { headlines: Record<CageCategory, string>; sublines: readonly string[] };
  linux: { pass: string };
  audioPass: string;
}

export interface CaptchaState {
  round: Round;
  phase: 'round' | 'feedback' | 'complete' | 'skipped';
  selected: string[];
  roundRejections: number;
  totalRejections: number;
  promptVariant: 'A' | 'B';
  flipped: boolean;
  feedback: { headline: string; subline: string } | null;
  advanceTo: Round | null;
  method: Method | null;
}

export type CaptchaEvent =
  | { t: 'TOGGLE'; id: string }
  | { t: 'SUBMIT' }
  | { t: 'FEEDBACK_DONE' }
  | { t: 'SKIP' }
  | { t: 'AUDIO_PASS' }
  | { t: 'FLIP' };

export const initialCaptcha: CaptchaState = {
  round: 'windows',
  phase: 'round',
  selected: [],
  roundRejections: 0,
  totalRejections: 0,
  promptVariant: 'A',
  flipped: false,
  feedback: null,
  advanceTo: null,
  method: null,
};

/** Classify a window selection. The "window of opportunity" tile counts as both kinds → mixed. */
export function categorizeWindows(
  selected: readonly string[],
  tiles: readonly CaptchaTile[],
): WindowCategory {
  if (selected.length === 0) return 'none';
  if (selected.length === tiles.length) return 'all';
  const chosen = tiles.filter((t) => selected.includes(t.id));
  const soft = chosen.every((t) => t.tags.includes('software') && !t.tags.includes('physical'));
  const phys = chosen.every((t) => t.tags.includes('physical') && !t.tags.includes('software'));
  if (soft) return 'software-only';
  if (phys) return 'physical-only';
  return 'mixed';
}

export function categorizeCage(selected: readonly string[], total: number): CageCategory {
  if (selected.length === 0) return 'none';
  if (selected.length >= total) return 'all';
  return 'some';
}

export function captchaReducer(
  s: CaptchaState,
  e: CaptchaEvent,
  ctx: { windowTiles: readonly CaptchaTile[]; cageCount: number; copy: Copy },
): CaptchaState {
  if (s.phase === 'complete' || s.phase === 'skipped') return s;
  switch (e.t) {
    case 'TOGGLE': {
      if (s.phase !== 'round' || s.round === 'linux') return s;
      const has = s.selected.includes(e.id);
      return { ...s, selected: has ? s.selected.filter((x) => x !== e.id) : [...s.selected, e.id] };
    }
    case 'FLIP':
      return s.round === 'cage' ? { ...s, flipped: true } : s;
    case 'SUBMIT': {
      if (s.phase !== 'round') return s; // feedback lock: repeated clicks are ignored
      if (s.round === 'linux') {
        return {
          ...s,
          phase: 'complete',
          method: 'linux',
          feedback: { headline: ctx.copy.linux.pass, subline: '' },
        };
      }
      const n = s.roundRejections + 1;
      const total = s.totalRejections + 1;
      if (s.round === 'windows') {
        const cat = categorizeWindows(s.selected, ctx.windowTiles);
        return {
          ...s,
          phase: 'feedback',
          roundRejections: n,
          totalRejections: total,
          feedback: {
            headline: ctx.copy.windows.headlines[cat],
            subline: ctx.copy.windows.sublines[n - 1] ?? '',
          },
          advanceTo: n >= MAX_ROUND_REJECTIONS ? 'cage' : null,
        };
      }
      const cat = categorizeCage(s.selected, ctx.cageCount);
      return {
        ...s,
        phase: 'feedback',
        flipped: true,
        roundRejections: n,
        totalRejections: total,
        promptVariant: n >= 2 ? 'B' : s.promptVariant,
        feedback: {
          headline: ctx.copy.cage.headlines[cat],
          subline: ctx.copy.cage.sublines[n - 1] ?? '',
        },
        advanceTo: n >= MAX_ROUND_REJECTIONS || total >= MAX_TOTAL_REJECTIONS ? 'linux' : null,
      };
    }
    case 'FEEDBACK_DONE':
      if (s.phase !== 'feedback') return s;
      if (s.advanceTo) {
        return {
          ...s,
          phase: 'round',
          round: s.advanceTo,
          advanceTo: null,
          roundRejections: 0,
          selected: [],
          promptVariant: 'A',
        };
      }
      return { ...s, phase: 'round', selected: [] };
    case 'SKIP':
      return { ...s, phase: 'skipped' };
    case 'AUDIO_PASS':
      return {
        ...s,
        phase: 'complete',
        method: 'audio',
        feedback: { headline: ctx.copy.audioPass, subline: '' },
      };
    default:
      return s;
  }
}
