/**
 * Totalitarian cookie banner (parody). Sets no cookies; stores one preference boolean-ish value.
 * Deleting it via DevTools reveals that it was load-bearing (a MutationObserver, not security).
 */
import { register, start, stop, type SceneCtx } from '../../lib/scene';
import {
  readPrefs,
  readSession,
  writePrefs,
  writeSession,
  type BannerState,
} from '../../lib/storage';
import { focusIn } from '../../lib/dialog';
import { runaway } from '../../lib/runaway';
import { bump } from '../../lib/threat';
import { announce } from '../../lib/announce';
import { banner as copy, receipts, loadBearing } from '../../content/copy/cookies';
import { openVendors } from '../vendors';

export const BANNER_RESOLVED = 'uvcr:banner-resolved';

function receiptEl(title: string, lines: readonly string[]): HTMLElement {
  const box = document.createElement('div');
  box.className = 'receipt';
  box.setAttribute('role', 'status');
  const h = document.createElement('p');
  h.className = 'receipt__title';
  h.textContent = title;
  const ul = document.createElement('ul');
  for (const l of lines) {
    const li = document.createElement('li');
    li.textContent = l;
    ul.append(li);
  }
  box.append(h, ul);
  return box;
}

register({
  id: 'cookie-banner',
  major: false,
  start(ctx: SceneCtx) {
    const el = document.querySelector<HTMLElement>('[data-cookie-banner]');
    const lb = document.querySelector<HTMLElement>('[data-load-bearing]');
    if (!el) return;
    const { d } = ctx;
    let legitClose = false;
    const parent = el.parentElement;
    const next = el.nextSibling;

    el.hidden = false;
    d.add(() => {
      el.hidden = true;
    });
    focusIn(el as unknown as HTMLDialogElement, el.querySelector<HTMLElement>('#cb-title'));

    const finish = (state: BannerState, receipt: { title: string; lines: readonly string[] }) => {
      writePrefs({ cookieBanner: state });
      const slot = el.querySelector<HTMLElement>('[data-cb-receipt]');
      const actions = el.querySelector<HTMLElement>('[data-cb-actions]');
      if (actions) actions.hidden = true;
      if (slot) {
        slot.replaceChildren(receiptEl(receipt.title, receipt.lines));
        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'btn btn--primary';
        close.textContent = copy.close;
        close.addEventListener('click', () => done());
        slot.append(close);
        close.focus({ preventScroll: true });
      }
      announce(receipt.lines[0] ?? receipt.title);
      ctx.d.timeout(done, 3500);
    };
    const done = () => {
      if (legitClose) return;
      legitClose = true;
      document.dispatchEvent(new CustomEvent(BANNER_RESOLVED));
      stop('cookie-banner', 'complete');
      document.getElementById('main')?.focus({ preventScroll: true });
    };

    d.on(el, 'click', (e) => {
      const b = (e.target as HTMLElement).closest<HTMLElement>('[data-cb]');
      if (!b) return;
      const act = b.dataset.cb;
      if (act === 'accept' || act === 'accept-cookies') finish('accepted', receipts.accept);
      else if (act === 'reject') finish('rejected', receipts.reject);
      else if (act === 'manage') openVendors(b, () => finish('managed', receipts.managed));
    });

    const reject = el.querySelector<HTMLElement>('[data-cb="reject"]');
    const arena = el.querySelector<HTMLElement>('[data-cb-reject-arena]');
    if (reject && arena) {
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
    }

    // The banner is load-bearing: removing it (e.g. in DevTools) triggers one structural warning.
    if (lb && parent && !readSession().loadBearingShown) {
      const snapshot = el;
      const mo = new MutationObserver((muts) => {
        if (legitClose) return;
        for (const m of muts) {
          for (const n of m.removedNodes) {
            if (n === snapshot || (n instanceof Element && n.contains(snapshot))) {
              mo.disconnect();
              writeSession({ loadBearingShown: true });
              bump('bannerRemoved');
              lb.hidden = false;
              lb.querySelector<HTMLElement>('#lb-title')?.focus({ preventScroll: true });
              announce(loadBearing.title, 'assertive');
              const onClick = (ev: Event) => {
                const act = (ev.target as HTMLElement).closest<HTMLElement>('[data-lb]')?.dataset
                  .lb;
                if (!act) return;
                lb.hidden = true;
                lb.removeEventListener('click', onClick);
                if (act === 'restore') {
                  parent.insertBefore(snapshot, next && parent.contains(next) ? next : null);
                  focusIn(
                    snapshot as unknown as HTMLDialogElement,
                    snapshot.querySelector<HTMLElement>('#cb-title'),
                  );
                } else {
                  done();
                }
              };
              lb.addEventListener('click', onClick);
              return;
            }
          }
        }
      });
      mo.observe(document.body, { childList: true, subtree: true });
      d.add(() => {
        legitClose = true;
        mo.disconnect();
      });
    }
  },
});

/** Start the banner if the visitor hasn't dealt with it yet. Resolves immediately otherwise. */
export async function maybeStartBanner(): Promise<boolean> {
  if (readPrefs().cookieBanner !== 'pending') return false;
  return start('cookie-banner');
}
