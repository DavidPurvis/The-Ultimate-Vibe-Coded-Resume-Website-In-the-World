/**
 * How the visitor is interacting, read at the moment of use. It picks a *performance* of a beat
 * (a control that moves, one that is reassigned by text), never what the visitor is entitled to,
 * and it is never recorded or dispatched.
 */
import type { Scope } from './lifecycle';

export interface ModalityProfile {
  reducedMotion(): boolean;
  finePointer(): boolean;
  /** Call `fn` when the motion preference changes mid-session. */
  onChange(scope: Scope, fn: () => void): void;
}

const mq = (q: string): MediaQueryList | null =>
  typeof matchMedia === 'function' ? matchMedia(q) : null;

export function modality(): ModalityProfile {
  return {
    reducedMotion: () => mq('(prefers-reduced-motion: reduce)')?.matches ?? false,
    finePointer: () => mq('(pointer: fine)')?.matches ?? false,
    onChange(scope, fn) {
      const m = mq('(prefers-reduced-motion: reduce)');
      if (m) scope.on(m, 'change', fn);
    },
  };
}

export type Input = 'mouse' | 'touch' | 'pen' | 'keyboard';

/** What produced an activation. Keyboard-activated clicks have detail 0 and no pointer type. */
export function inputOf(e: Event): Input {
  const pt = (e as PointerEvent).pointerType;
  if (pt === 'touch' || pt === 'pen') return pt;
  if (e.type === 'click' && (e as MouseEvent).detail === 0) return 'keyboard';
  return 'mouse';
}
