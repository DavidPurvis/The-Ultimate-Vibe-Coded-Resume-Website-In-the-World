/**
 * The résumé release procedure: exactly three views in one dialog (Résumé request, Request
 * confirmation, Determination). Every view offers Go directly to résumé and an ordinary close.
 * The determination summarizes only what the case record actually holds, and approval is recorded
 * when it is shown; nothing navigates by itself. Escape or closing early costs nothing, and the
 * next request starts again at the first view. A major scene: a replacement procedure, Direct
 * access or leaving the page closes it and removes it.
 */
import { closeDialog, focusIn, openDialog } from '../lib/dialog';
import { register, stop, type SceneCtx } from '../lib/scene';
import { readPrefs, readSession } from '../lib/storage';
import { determinationSummary, release as R } from '../content/department/case';
import { evidenceOf } from './evidence';
import { releaseSummary } from './policy';
import { updateCase } from './record';

type View = 'request' | 'confirm' | 'determination';

let opener: HTMLAnchorElement | null = null;

/** The Request résumé link that asked; its href is the résumé, and focus returns to it. */
export function setOpener(a: HTMLAnchorElement): void {
  opener = a;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<HTMLElementTagNameMap[K]> = {},
  ...children: (Node | string)[]
): HTMLElementTagNameMap[K] {
  const e = Object.assign(document.createElement(tag), props);
  e.append(...children);
  return e;
}

/** Registered on load; exported so tests can register it again after resetting the registry. */
export function registerRelease(): void {
  register({
    id: 'release',
    major: true,
    start(ctx: SceneCtx) {
      const a = opener;
      if (!a) return;
      const href = a.href;
      const heading = el('h2', { id: 'release-title', tabIndex: -1 });
      const body = el('div', { className: 'release__body' });
      const actions = el('div', { className: 'btn-row' });
      const close = el('button', {
        type: 'button',
        className: 'btn btn--ghost',
        textContent: R.close,
      });
      close.dataset.close = '';
      const dialog = el(
        'dialog',
        { id: 'release', className: 'scene-dialog release' },
        el(
          'div',
          { className: 'scene-dialog__head' },
          el('p', { className: 'kicker', textContent: R.title }),
        ),
        el('div', { className: 'scene-dialog__body' }, heading, body, actions),
      );
      dialog.setAttribute('aria-labelledby', 'release-title');
      dialog.dataset.releaseView = 'request';
      ctx.d.node(document.body.appendChild(dialog));

      const direct = (): HTMLAnchorElement =>
        el('a', { className: 'btn', href, textContent: R.direct });

      const show = (view: View): void => {
        dialog.dataset.releaseView = view;
        if (view === 'determination') {
          const s = readSession();
          const summary = releaseSummary(s.caseFile, evidenceOf(s, readPrefs()));
          heading.textContent = R.determination.heading;
          body.replaceChildren(
            el('p', { textContent: determinationSummary(summary) }),
            el('p', { className: 'release__approved', textContent: R.determination.approved }),
          );
          const open = el('a', {
            className: 'btn btn--primary',
            href,
            textContent: R.determination.action,
          });
          actions.replaceChildren(open, direct(), close);
        } else {
          const v = view === 'request' ? R.request : R.confirm;
          heading.textContent = v.heading;
          body.replaceChildren(el('p', { textContent: v.body }));
          const next = el('button', {
            type: 'button',
            className: 'btn btn--primary',
            textContent: v.action,
          });
          next.addEventListener('click', () =>
            show(view === 'request' ? 'confirm' : 'determination'),
          );
          actions.replaceChildren(next, direct(), close);
        }
        focusIn(dialog, heading);
        // Approval is recorded once the determination is actually on screen.
        if (view === 'determination' && dialog.open) updateCase({ t: 'release' });
      };

      openDialog(dialog, {
        opener: a,
        initialFocus: heading,
        onClose: () => stop('release', 'complete'),
      });
      ctx.d.add(() => closeDialog(dialog));
      show('request');
    },
  });
}

registerRelease();
