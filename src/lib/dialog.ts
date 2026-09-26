/** Native <dialog> helpers: focus the heading, return focus to the opener, one close path. */
export interface OpenOpts {
  initialFocus?: HTMLElement | string | null;
  onClose?: (returnValue: string) => void;
  opener?: HTMLElement | null;
}

const openers = new WeakMap<HTMLDialogElement, HTMLElement | null>();
const closers = new WeakMap<HTMLDialogElement, (rv: string) => void>();

function wire(d: HTMLDialogElement): void {
  if (d.dataset.wired) return;
  d.dataset.wired = '1';
  d.addEventListener('click', (e) => {
    const t = e.target as HTMLElement | null;
    if (t?.closest('[data-close]')) closeDialog(d, 'close');
  });
  d.addEventListener('close', () => {
    const cb = closers.get(d);
    closers.delete(d);
    const opener = openers.get(d);
    openers.delete(d);
    cb?.(d.returnValue || 'close');
    if (opener && document.contains(opener)) opener.focus({ preventScroll: true });
  });
}

export function focusIn(d: HTMLDialogElement, target?: HTMLElement | string | null): void {
  const el =
    typeof target === 'string'
      ? d.querySelector<HTMLElement>(target)
      : (target ?? d.querySelector<HTMLElement>('h2[tabindex="-1"]'));
  el?.focus({ preventScroll: true });
}

export function openDialog(d: HTMLDialogElement, o: OpenOpts = {}): void {
  wire(d);
  const opener =
    o.opener ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
  if (o.onClose) closers.set(d, o.onClose);
  if (!d.open) {
    openers.set(d, opener);
    d.returnValue = '';
    d.showModal();
  }
  focusIn(d, o.initialFocus);
}

export function closeDialog(d: HTMLDialogElement, returnValue = 'close'): void {
  if (d.open) d.close(returnValue);
}
