/**
 * Musical material, as a major scene. The YouTube (privacy-enhanced) iframe is created only when a
 * play control starts the scene, and it is removed whenever the scene ends: Close, Escape, a
 * replacement procedure, Direct access or navigation. Nothing third-party loads until asked for,
 * and nothing keeps playing afterwards.
 */
import { closeDialog, openDialog } from '../../lib/dialog';
import { register, start, stop, type SceneCtx } from '../../lib/scene';
import { bump } from '../../lib/threat';
import { RICK_EMBED, rickDialog } from '../../content/copy/rick';

export interface RickOpts {
  continueHref?: string | null;
  opener?: HTMLElement | null;
  onClose?: () => void;
}

let opts: RickOpts = {};

register({
  id: 'music',
  major: true,
  start(ctx: SceneCtx) {
    const d = document.getElementById('rickroll') as HTMLDialogElement | null;
    const slot = d?.querySelector<HTMLElement>('[data-rick-slot]');
    if (!d || !slot) return;
    const o = opts;
    const fallback = d.querySelector<HTMLElement>('[data-rick-fallback]');
    const cont = d.querySelector<HTMLAnchorElement>('[data-rick-continue]');
    const notLoading = d.querySelector<HTMLButtonElement>('[data-rick-notloading]');

    const iframe = document.createElement('iframe');
    iframe.src = RICK_EMBED;
    iframe.title = rickDialog.iframeTitle;
    iframe.allow = 'autoplay; encrypted-media; picture-in-picture';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    slot.replaceChildren(iframe);
    ctx.d.add(() => slot.replaceChildren()); // stops playback
    if (fallback) fallback.hidden = true;
    if (notLoading) notLoading.hidden = false;
    if (cont) {
      cont.hidden = !o.continueHref;
      if (o.continueHref) cont.href = o.continueHref;
    }
    if (notLoading)
      ctx.d.on(
        notLoading,
        'click',
        () => {
          slot.replaceChildren();
          if (fallback) fallback.hidden = false;
          notLoading.hidden = true;
        },
        { once: true },
      );

    bump('rickroll');
    openDialog(d, {
      opener: o.opener ?? null,
      onClose: () => {
        stop('music', 'complete');
        o.onClose?.();
      },
    });
    ctx.d.add(() => closeDialog(d));
  },
});

/** Play the musical material (from an explicit play control only). */
export function openRickroll(o: RickOpts = {}): Promise<boolean> {
  opts = o;
  return start('music');
}

export function closeRickroll(): void {
  stop('music', 'complete');
}
