/**
 * Consensual rickrolls. The YouTube (privacy-enhanced) iframe is created only inside a click
 * handler and removed on close, so nothing third-party loads until you ask and nothing keeps
 * playing after you leave.
 */
import { closeDialog, openDialog } from '../../lib/dialog';
import { bump } from '../../lib/threat';
import { RICK_EMBED, rickDialog } from '../../content/copy/rick';

export interface RickOpts {
  continueHref?: string | null;
  opener?: HTMLElement | null;
  onClose?: () => void;
}

export function openRickroll(o: RickOpts = {}): void {
  const d = document.getElementById('rickroll') as HTMLDialogElement | null;
  if (!d) return;
  const slot = d.querySelector<HTMLElement>('[data-rick-slot]');
  const fallback = d.querySelector<HTMLElement>('[data-rick-fallback]');
  const cont = d.querySelector<HTMLAnchorElement>('[data-rick-continue]');
  const notLoading = d.querySelector<HTMLButtonElement>('[data-rick-notloading]');
  if (!slot) return;

  const iframe = document.createElement('iframe');
  iframe.src = RICK_EMBED;
  iframe.title = rickDialog.iframeTitle;
  iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.referrerPolicy = 'strict-origin-when-cross-origin';
  slot.replaceChildren(iframe);
  if (fallback) fallback.hidden = true;
  if (notLoading) notLoading.hidden = false;
  if (cont) {
    cont.hidden = !o.continueHref;
    if (o.continueHref) cont.href = o.continueHref;
  }

  const showFallback = () => {
    slot.replaceChildren();
    if (fallback) fallback.hidden = false;
    if (notLoading) notLoading.hidden = true;
  };
  notLoading?.addEventListener('click', showFallback, { once: true });

  bump('rickroll');
  openDialog(d, {
    opener: o.opener ?? null,
    onClose: () => {
      slot.replaceChildren(); // stops playback
      notLoading?.removeEventListener('click', showFallback);
      o.onClose?.();
    },
  });
}

export function closeRickroll(): void {
  const d = document.getElementById('rickroll') as HTMLDialogElement | null;
  if (d) closeDialog(d);
}
