/** The Upside Down: wheel scrolling is inverted inside one labelled box, and nowhere else. */
import { finePointer, reducedMotion } from '../../runtime/modality';
import { isChaos, onModeChange } from '../../lib/mode';

const box = document.querySelector<HTMLElement>('[data-upside]');
const note = document.querySelector<HTMLElement>('[data-upside-disabled]');

function enabled(): boolean {
  return isChaos() && finePointer() && !reducedMotion();
}

function sync(): void {
  if (note) note.hidden = enabled();
}

export function normalizeDelta(
  e: { deltaY: number; deltaMode: number },
  pageHeight: number,
): number {
  if (e.deltaMode === 1) return e.deltaY * 16;
  if (e.deltaMode === 2) return e.deltaY * pageHeight;
  return e.deltaY;
}

if (box) {
  sync();
  onModeChange(sync);
  box.addEventListener(
    'wheel',
    (e) => {
      if (!enabled()) return;
      e.preventDefault();
      box.scrollTop -= normalizeDelta(e, box.clientHeight);
    },
    { passive: false },
  );
}
