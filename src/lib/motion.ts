/** Motion + pointer preferences and last input modality. */
const mq = (q: string) => (typeof matchMedia === 'function' ? matchMedia(q) : null);

export function reducedMotion(): boolean {
  return mq('(prefers-reduced-motion: reduce)')?.matches ?? false;
}
export function finePointer(): boolean {
  return mq('(pointer: fine)')?.matches ?? false;
}

export type Modality = 'mouse' | 'touch' | 'pen' | 'keyboard';
let modality: Modality = 'mouse';
let tracking = false;

export function trackModality(): void {
  if (tracking || typeof window === 'undefined') return;
  tracking = true;
  window.addEventListener(
    'pointerdown',
    (e) => {
      modality = (e.pointerType as Modality) || 'mouse';
    },
    { capture: true, passive: true },
  );
  window.addEventListener(
    'keydown',
    (e) => {
      if (
        ['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)
      ) {
        modality = 'keyboard';
      }
    },
    { capture: true, passive: true },
  );
}
export function lastModality(): Modality {
  return modality;
}
/** A click produced by keyboard activation (Enter/Space) rather than a pointer. */
export function isKeyboardClick(e: MouseEvent): boolean {
  return e.detail === 0 || modality === 'keyboard';
}
