/** Identity Checkpoint as a pure state machine (plan §9.5). The claimed identity is stored ONLY on SUBMIT. */
import type { IdentityId } from '../../content/copy/identity';

export type Phase = 'idle' | 'choose' | 'confirm' | 'final' | 'result' | 'complete' | 'dismissed';
export type Confirmation = 'keep' | 'double' | 'prompt';

export interface IdentityState {
  phase: Phase;
  claimed: IdentityId | null;
  pending: IdentityId | null;
  confirmation: Confirmation | null;
  refused: boolean;
  finalText: string;
  finalSkipped: boolean;
  error: 'empty' | null;
}

export type IdentityEvent =
  | { t: 'OPEN' }
  | { t: 'REPLAY' }
  | { t: 'SELECT'; id: IdentityId }
  | { t: 'SUBMIT' }
  | { t: 'REFUSE' }
  | { t: 'KEEP' }
  | { t: 'DOUBLE' }
  | { t: 'CHECK_PROMPT' }
  | { t: 'CHANGE' }
  | { t: 'VERIFY_TEXT'; text: string }
  | { t: 'SKIP_FINAL' }
  | { t: 'CONTINUE' }
  | { t: 'CLOSE' };

export const initialIdentity: IdentityState = {
  phase: 'idle',
  claimed: null,
  pending: null,
  confirmation: null,
  refused: false,
  finalText: '',
  finalSkipped: false,
  error: null,
};

const OPEN_PHASES: readonly Phase[] = ['choose', 'confirm', 'final', 'result'];

export function identityReducer(s: IdentityState, e: IdentityEvent): IdentityState {
  switch (e.t) {
    case 'OPEN':
    case 'REPLAY':
      if (OPEN_PHASES.includes(s.phase)) return s;
      return { ...initialIdentity, claimed: s.claimed, pending: s.claimed, phase: 'choose' };
    case 'SELECT':
      return s.phase === 'choose' ? { ...s, pending: e.id, error: null } : s;
    case 'SUBMIT':
      if (s.phase !== 'choose') return s;
      if (!s.pending) return { ...s, error: 'empty' };
      return { ...s, claimed: s.pending, refused: false, phase: 'confirm', error: null };
    case 'REFUSE':
      return s.phase === 'choose' ? { ...s, refused: true, phase: 'result', error: null } : s;
    case 'KEEP':
    case 'DOUBLE':
    case 'CHECK_PROMPT':
      if (s.phase !== 'confirm') return s;
      return {
        ...s,
        phase: 'final',
        confirmation: e.t === 'KEEP' ? 'keep' : e.t === 'DOUBLE' ? 'double' : 'prompt',
      };
    case 'CHANGE':
      return s.phase === 'confirm' ? { ...s, phase: 'choose', confirmation: null } : s;
    case 'VERIFY_TEXT':
      return s.phase === 'final'
        ? { ...s, finalText: e.text, finalSkipped: false, phase: 'result' }
        : s;
    case 'SKIP_FINAL':
      return s.phase === 'final' ? { ...s, finalSkipped: true, phase: 'result' } : s;
    case 'CONTINUE':
      return s.phase === 'result' ? { ...s, phase: 'complete' } : s;
    case 'CLOSE':
      return OPEN_PHASES.includes(s.phase) ? { ...s, phase: 'dismissed' } : s;
    default:
      return s;
  }
}

/** What gets persisted to the session (never the transcription text). */
export function snapshot(s: IdentityState): {
  claimed: string | null;
  refused: boolean;
  confirmation: string | null;
} {
  return { claimed: s.claimed, refused: s.refused, confirmation: s.confirmation };
}
