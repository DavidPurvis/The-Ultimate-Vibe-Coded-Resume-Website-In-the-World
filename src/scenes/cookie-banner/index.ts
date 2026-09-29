/**
 * Cookie administration: a major scene in one modal dialog, started only by an explicit request
 * (the Facilities control or the invitation notice). Consent, the partner directory and the
 * certificate are views of the same dialog, so nothing stacks. It sets no cookies; answering
 * stores one preference. Closing, Escape, a replacement procedure, navigation or Direct access
 * disposes it, and focus returns to whatever asked for it. It never opens anything else.
 *
 * Deleting the dialog in DevTools reveals that it was load-bearing (a MutationObserver, once per
 * session; not security).
 */
import { register, stop, type SceneCtx } from '../../lib/scene';
import { readSession, writePrefs, writeSession, type BannerState } from '../../lib/storage';
import { closeDialog, focusIn, openDialog } from '../../lib/dialog';
import { runaway } from '../../lib/runaway';
import { bump } from '../../lib/threat';
import { announce } from '../../runtime/announce';
import { banner as copy, receipts, loadBearing } from '../../content/copy/cookies';

/** Fired on document when the visitor has answered (the invitation notice listens for it). */
export const COOKIES_ANSWERED = 'uvcr:cookies';

type View = 'consent' | 'partners' | 'certificate';

let opener: HTMLElement | null = null;

/** Focus returns here when the procedure ends. */
export function setOpener(el: HTMLElement | null): void {
  opener = el;
}

register({
  id: 'cookie-banner',
  major: true,
  start(ctx: SceneCtx) {
    const dialog = document.querySelector<HTMLDialogElement>('dialog[data-cookie-banner]');
    const lb = document.querySelector<HTMLElement>('[data-load-bearing]');
    if (!dialog) return;
    const { d } = ctx;
    const view = (name: View, focus: string): void => {
      dialog.querySelectorAll<HTMLElement>('[data-cb-view]').forEach((v) => {
        v.hidden = v.dataset.cbView !== name;
      });
      focusIn(dialog, focus);
    };
    let answered = false;

    const finish = (state: BannerState, receipt: { title: string; lines: readonly string[] }) => {
      writePrefs({ cookieBanner: state });
      answered = true;
      const title = dialog.querySelector<HTMLElement>('[data-cb-certificate-title]');
      const lines = dialog.querySelector<HTMLElement>('[data-cb-certificate-lines]');
      if (title) title.textContent = receipt.title;
      lines?.replaceChildren(
        ...receipt.lines.map((l) =>
          Object.assign(document.createElement('li'), { textContent: l }),
        ),
      );
      view('certificate', '#cb-certificate-title');
      announce(`${receipt.title}. ${receipt.lines[0] ?? ''}`);
    };

    view('consent', '#cb-title');
    openDialog(dialog, {
      opener,
      initialFocus: '#cb-title',
      onClose: () => {
        stop('cookie-banner', 'complete');
        if (answered) document.dispatchEvent(new Event(COOKIES_ANSWERED));
      },
    });
    d.add(() => closeDialog(dialog));

    d.on(dialog, 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-cb]');
      const act = b?.dataset.cb;
      if (act === 'accept' || act === 'accept-cookies') finish('accepted', receipts.accept);
      else if (act === 'reject') finish('rejected', receipts.reject);
      else if (act === 'manage') {
        // 3,000 fictional partners load only for the people who ask to manage them.
        void import('../vendors').then((m) => {
          const root = dialog.querySelector<HTMLElement>('[data-cb-view="partners"]');
          if (!ctx.stillActive() || !root) return;
          m.showPartners(root, {
            save: () => finish('managed', receipts.managed),
            back: () => view('consent', '#cb-title'),
          });
          view('partners', '#cb-partners-title');
        });
      }
    });

    const reject = dialog.querySelector<HTMLElement>('[data-cb="reject"]');
    const arena = dialog.querySelector<HTMLElement>('[data-cb-reject-arena]');
    if (reject && arena)
      runaway(
        {
          id: 'cb-reject',
          el: reject,
          arena,
          mode: 'enter',
          maxDodges: 2,
          distance: 120,
          labels: copy.rejectLabels,
          onDodge: () => bump('dodge'),
        },
        d,
      );

    // Load-bearing: removing the dialog (e.g. in DevTools) triggers one structural warning.
    const parent = dialog.parentElement;
    const next = dialog.nextSibling;
    if (lb && parent && !readSession().loadBearingShown) {
      let ended = false;
      d.add(() => {
        ended = true;
      });
      const mo = new MutationObserver((muts) => {
        if (ended) return;
        const gone = muts.some((m) =>
          [...m.removedNodes].some(
            (n) => n === dialog || (n instanceof Element && n.contains(dialog)),
          ),
        );
        if (!gone) return;
        mo.disconnect();
        writeSession({ loadBearingShown: true });
        bump('bannerRemoved');
        lb.hidden = false;
        lb.querySelector<HTMLElement>('#lb-title')?.focus({ preventScroll: true });
        announce(loadBearing.title, 'assertive');
        const onClick = (ev: Event) => {
          const choice = (ev.target as HTMLElement).closest<HTMLElement>('[data-lb]')?.dataset.lb;
          if (!choice) return;
          lb.hidden = true;
          lb.removeEventListener('click', onClick);
          stop('cookie-banner', 'complete');
          if (choice === 'restore')
            parent.insertBefore(dialog, next && parent.contains(next) ? next : null);
          (opener?.isConnected ? opener : document.getElementById('main'))?.focus({
            preventScroll: true,
          });
        };
        lb.addEventListener('click', onClick);
      });
      mo.observe(document.body, { childList: true, subtree: true });
      d.observe(mo);
    }
  },
});
