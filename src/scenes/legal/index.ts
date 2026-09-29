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
  if (typeof IntersectionObserver === 'undefined') {
    tos.appended.forEach(issue);
    ready();
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        const next = tos.appended[added];
        if (next === undefined) return;
        issue(next);
        added += 1;
        if (added >= tos.appended.length) {
          io.disconnect();
          ready();
        }
      },
      { root: box, threshold: 1 },
    );
    io.observe(sentinel);
    scope.observe(io);
  }

  scope.on(accept, 'click', () => {
    if (accept.getAttribute('aria-disabled') === 'true') return;
    receipt.textContent = tos.receipt;
    accept.hidden = true;
    receipt.tabIndex = -1;
    receipt.focus({ preventScroll: true });
  });
});
