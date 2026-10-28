/**
 * /legal/: the terms grow as they are read (finitely). The acknowledgement becomes available once
 * the last term has been issued, and the interaction ends when it is pressed.
 */
import { mountPage } from '../../runtime/lifecycle';

const read = <T>(sel: string, key: string): T =>
  JSON.parse(document.querySelector<HTMLElement>(sel)?.dataset[key] ?? '{}') as T;

mountPage(({ scope }) => {
  const tos = read<{ appended: string[]; receipt: string }>('[data-tos-copy]', 'tosCopy');
  const more = document.querySelector<HTMLElement>('[data-tos-more]');
  const sentinel = document.querySelector<HTMLElement>('[data-tos-sentinel]');
  const accept = document.querySelector<HTMLButtonElement>('[data-tos-accept]');
  const box = document.querySelector<HTMLElement>('[data-tos]');
  const receipt = document.querySelector<HTMLElement>('[data-tos-receipt]');
  if (!more || !sentinel || !accept || !box || !receipt) return;

  const issue = (text: string): void => {
    const p = document.createElement('p');
    p.textContent = text;
    more.append(p);
  };
  const ready = (): void => accept.removeAttribute('aria-disabled');

  let added = 0;
  const appendNext = (): void => {
    const next = tos.appended[added];
    if (next === undefined) return;
    issue(next);
    added += 1;
    if (added >= tos.appended.length) ready();
  };
  const fillVisible = (): void => {
    // A short addition may leave the sentinel visible, producing no new observer transition.
    do {
      appendNext();
    } while (added < tos.appended.length && box.scrollHeight <= box.clientHeight);
  };
  if (typeof IntersectionObserver === 'undefined') {
    tos.appended.forEach(issue);
    ready();
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) fillVisible();
        if (added >= tos.appended.length) io.disconnect();
      },
      { root: box, threshold: 1 },
    );
    io.observe(sentinel);
    scope.observe(io);
    scope.on(box, 'scroll', () => {
      if (box.scrollHeight - box.scrollTop - box.clientHeight < 12) fillVisible();
    });
  }

  scope.on(accept, 'click', () => {
    if (accept.getAttribute('aria-disabled') === 'true') return;
    receipt.textContent = tos.receipt;
    accept.hidden = true;
    receipt.tabIndex = -1;
    receipt.focus({ preventScroll: true });
  });
});
