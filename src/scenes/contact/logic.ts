/** The artisanal email drum: 40 characters on a ring, one at a time. */
export const DRUM_CHARS = [...'abcdefghijklmnopqrstuvwxyz0123456789@._-'] as const;
export const DRUM_STEP_DEG = 360 / DRUM_CHARS.length;

export interface DrumState {
  index: number;
  composed: string;
}
export type DrumEvent = { t: 'UP' } | { t: 'DOWN' } | { t: 'ADD' } | { t: 'DELETE' };

export const MAX_EMAIL = 64;

export function drumReducer(s: DrumState, e: DrumEvent): DrumState {
  const n = DRUM_CHARS.length;
  switch (e.t) {
    case 'UP':
      return { ...s, index: (s.index - 1 + n) % n };
    case 'DOWN':
      return { ...s, index: (s.index + 1) % n };
    case 'ADD':
      return s.composed.length >= MAX_EMAIL
        ? s
        : { ...s, composed: s.composed + (DRUM_CHARS[s.index] ?? '') };
    case 'DELETE':
      return { ...s, composed: s.composed.slice(0, -1) };
  }
}

export const currentChar = (s: DrumState): string => DRUM_CHARS[s.index] ?? '';
