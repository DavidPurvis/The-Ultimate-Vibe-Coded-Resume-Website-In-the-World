/**
 * Classification as a pure state machine. A declaration exists only once a result is reached:
 * closing before that declares nothing. The transcription is a yes/no fact, never its text.
 */
import type { ModelId } from '../../content/copy/identity';
import type { IdentitySnapshot } from '../../lib/storage';

export type Phase =
  'idle' | 'choose' | 'human' | 'model' | 'confirm' | 'result' | 'transcribe' | 'dismissed';
export type Confirmation = 'keep' | 'double' | 'prompt';
export type Declared = IdentitySnapshot['declared'];

export interface IdentityState {
  phase: Phase;
  declared: Declared | null;
  model: ModelId | null;
  pending: ModelId | null;
  confirmation: Confirmation | null;
  transcription: 'done' | 'skipped' | null;
  error: 'empty' | null;
}

export type IdentityEvent =
  | { t: 'OPEN' }
  | { t: 'HUMAN' }
  | { t: 'AUTOMATED' }
  | { t: 'WITHHOLD' }
  | { t: 'CONFIRM_HUMAN' }
  | { t: 'SELECT'; id: ModelId }
  | { t: 'SUBMIT' }
  | { t: 'KEEP' }
  | { t: 'DOUBLE' }
  | { t: 'CHECK_PROMPT' }
  | { t: 'BACK' }
  | { t: 'TRANSCRIBE' }
  | { t: 'TRANSCRIBED' }
  | { t: 'SKIP_TRANSCRIPTION' }
  | { t: 'CLOSE' };

export const initialIdentity: IdentityState = {
  phase: 'idle',
  declared: null,
  model: null,
  pending: null,
  confirmation: null,
  transcription: null,
  error: null,
};

const OPEN_PHASES: readonly Phase[] = [
  'choose',
  'human',
  'model',
  'confirm',
  'result',
  'transcribe',
];
export const isOpen = (s: IdentityState): boolean => OPEN_PHASES.includes(s.phase);

export function identityReducer(s: IdentityState, e: IdentityEvent): IdentityState {
  switch (e.t) {
    case 'OPEN':
      // Every opening starts over at the first question.
      return isOpen(s) ? s : { ...initialIdentity, phase: 'choose' };
    case 'HUMAN':
      return s.phase === 'choose' ? { ...s, phase: 'human' } : s;
    case 'AUTOMATED':
      return s.phase === 'choose' ? { ...s, phase: 'model', error: null } : s;
    case 'WITHHOLD':
      return s.phase === 'choose'
        ? { ...s, phase: 'result', declared: 'withheld', model: null, transcription: null }
        : s;
    case 'CONFIRM_HUMAN':
      return s.phase === 'human' ? { ...s, phase: 'result', declared: 'human', model: null } : s;
    case 'SELECT':
      return s.phase === 'model' ? { ...s, pending: e.id, error: null } : s;
    case 'SUBMIT':
      if (s.phase !== 'model') return s;
      if (!s.pending) return { ...s, error: 'empty' };
      return { ...s, phase: 'confirm', model: s.pending, error: null };
    case 'KEEP':
    case 'DOUBLE':
    case 'CHECK_PROMPT':
      if (s.phase !== 'confirm') return s;
      return {
        ...s,
        phase: 'result',
        declared: 'automated',
        confirmation: e.t === 'KEEP' ? 'keep' : e.t === 'DOUBLE' ? 'double' : 'prompt',
      };
    case 'BACK':
      if (s.phase === 'confirm') return { ...s, phase: 'model' };
      if (s.phase === 'human' || s.phase === 'model') return { ...s, phase: 'choose' };
      return s;
    case 'TRANSCRIBE':
      return s.phase === 'result' && (s.declared === 'human' || s.declared === 'automated')
        ? { ...s, phase: 'transcribe' }
        : s;
    case 'TRANSCRIBED':
      return s.phase === 'transcribe' ? { ...s, phase: 'result', transcription: 'done' } : s;
    case 'SKIP_TRANSCRIPTION':
      return s.phase === 'transcribe' ? { ...s, phase: 'result', transcription: 'skipped' } : s;
    case 'CLOSE':
      return isOpen(s) ? { ...s, phase: 'dismissed' } : s;
    default:
      return s;
  }
}

/** What is stored: the declaration (null until one was made), never any text. */
export function snapshot(s: IdentityState): IdentitySnapshot | null {
  if (!s.declared) return null;
  return {
    declared: s.declared,
    model: s.declared === 'automated' ? s.model : null,
    transcription: s.declared === 'withheld' ? null : s.transcription,
  };
}
